"""
ContextMind Python SDK
======================

Official Python client for the ContextMind API.
Reduce LLM token burn by 90% with automatic conversation summarization,
Theory of Mind extraction, and intelligent context retrieval.

Installation:
    pip install requests  # only dependency

Quickstart:
    from contextmind import ContextMind

    cm = ContextMind(api_key="ctxmind_your_key")

    # Create a peer (represents a user, agent, or object)
    peer = cm.peers.create(name="Alice", type="user")

    # Create a session (conversation thread)
    session = cm.sessions.create(peer_id=peer["id"])

    # Ingest messages
    result = cm.ingest(
        session_id=session["id"],
        messages=[
            {"role": "user", "content": "I prefer short, direct answers"},
            {"role": "assistant", "content": "Understood. I will keep it brief."},
        ],
        reasoning_level="medium"
    )

    # Get compressed context before your LLM call
    ctx = cm.context(session_id=session["id"], max_tokens=8000)
    # ctx.recent_messages  → verbatim recent messages (60% budget)
    # ctx.summary          → compressed history (40% budget)
    # ctx.representations  → Theory of Mind profile
    # ctx.compression_ratio → e.g. 0.09 = 91% token savings

    # Infer insights about the peer
    answer = cm.infer(
        peer_id=peer["id"],
        question="How should I explain technical concepts to this user?"
    )
    print(answer["answer"])
"""

import json
from typing import Optional, Literal, List, Dict, Any
try:
    import requests
except ImportError:
    raise ImportError("requests is required: pip install requests")

__version__ = "1.0.0"

ReasoningLevel = Literal["minimal", "low", "medium", "high", "max"]
PeerType = Literal["user", "agent", "object"]
MessageRole = Literal["user", "assistant", "system"]


class ContextMindError(Exception):
    """Base exception for ContextMind SDK errors."""
    def __init__(self, message: str, status_code: int = None, hint: str = None):
        self.status_code = status_code
        self.hint = hint
        super().__init__(f"{message}{f' — Hint: {hint}' if hint else ''}")


class AuthError(ContextMindError):
    """Raised when the API key is missing or invalid."""
    pass


class NotFoundError(ContextMindError):
    """Raised when the requested resource is not found."""
    pass


class ValidationError(ContextMindError):
    """Raised when request data fails validation."""
    pass


class ContextResponse:
    """
    The assembled context package returned by cm.context().

    Attributes:
        recent_messages (list):     Verbatim recent messages fitting the 60% token budget.
        summary (str | None):       Compressed conversation summary fitting the 40% budget.
        representations (list):     Theory of Mind insights about the peer, ordered by confidence.
        relevant_documents (list):  Semantically matched documents (if any were ingested).
        total_tokens (int):         Total tokens in this context package.
        compression_ratio (float):  Ratio of context tokens to full history.
                                    E.g. 0.09 = you're sending 9% of full history = 91% savings.
    """
    def __init__(self, data: dict):
        self.recent_messages: List[Dict] = data.get("recentMessages", [])
        self.summary: Optional[str] = data.get("summary")
        self.representations: List[Dict] = data.get("representations", [])
        self.relevant_documents: List[Dict] = data.get("relevantDocuments", [])
        self.total_tokens: int = data.get("totalTokens", 0)
        self.compression_ratio: float = data.get("compressionRatio", 1.0)
        self._raw = data

    @property
    def savings_percent(self) -> float:
        """How much token savings vs sending full history. E.g. 91.0 for 91%."""
        return round((1 - self.compression_ratio) * 100, 1)

    def to_openai_messages(self, system_prefix: str = "") -> List[Dict[str, str]]:
        """
        Convert context to OpenAI-compatible messages array.
        Assembles: system prompt (summary + representations) + recent messages.

        Args:
            system_prefix: Optional text to prepend to the system message.

        Returns:
            List of {"role": ..., "content": ...} dicts ready for OpenAI/Anthropic.

        Example:
            ctx = cm.context(session_id="...")
            messages = ctx.to_openai_messages(system_prefix="You are a helpful assistant.")
            response = openai.chat.completions.create(model="gpt-4o", messages=messages)
        """
        system_parts = []
        if system_prefix:
            system_parts.append(system_prefix)
        if self.summary:
            system_parts.append(f"\n\nCONVERSATION HISTORY SUMMARY:\n{self.summary}")
        if self.representations:
            rep_text = "\n".join(f"- {r['key']}: {r['value']} (confidence: {r['confidence']}%)"
                                 for r in self.representations)
            system_parts.append(f"\n\nUSER PROFILE (Theory of Mind):\n{rep_text}")

        result = []
        if system_parts:
            result.append({"role": "system", "content": "".join(system_parts)})
        for msg in self.recent_messages:
            result.append({"role": msg["role"], "content": msg["content"]})
        return result

    def __repr__(self):
        return (f"ContextResponse(total_tokens={self.total_tokens}, "
                f"savings={self.savings_percent}%, "
                f"representations={len(self.representations)})")


class InferResponse:
    """
    Response from the Infer API (Theory of Mind query).

    Attributes:
        answer (str):           Synthesized answer based on peer's psychological profile.
        confidence (int):       Average confidence score (0-100) of the source representations.
        sourced_from (list):    Representation keys used to generate the answer.
        peer_name (str):        Name of the queried peer.
        total_representations:  Total number of representations in this peer's profile.
    """
    def __init__(self, data: dict):
        self.answer: str = data.get("answer", "")
        self.confidence: int = data.get("confidence", 0)
        self.sourced_from: List[str] = data.get("sourcedFrom", [])
        self.peer_name: str = data.get("peerName", "")
        self.total_representations: int = data.get("totalRepresentations", 0)
        self._raw = data

    def __repr__(self):
        return (f"InferResponse(confidence={self.confidence}%, "
                f"sourced_from={self.sourced_from})")


class PeersResource:
    """CRUD operations for peers (users, agents, objects)."""

    def __init__(self, client: "ContextMind"):
        self._client = client

    def create(self, name: str, type: PeerType = "user", metadata: Dict = None) -> Dict:
        """
        Create a new peer.

        A peer represents any entity in your system that has a conversation history
        and psychological profile. Use type="user" for humans, type="agent" for AI
        agents, type="object" for non-person entities (e.g. a company, document).

        Args:
            name (str):         Display name for the peer.
            type (str):         One of "user", "agent", "object". Default: "user".
            metadata (dict):    Optional arbitrary metadata to attach to the peer.

        Returns:
            dict: Created peer with id, name, type, workspaceId, createdAt.

        Example:
            peer = cm.peers.create(name="Alice", type="user", metadata={"plan": "pro"})
            print(peer["id"])  # Use this as peerId in sessions and ingest calls
        """
        return self._client._post("/api/peers", {
            "name": name,
            "type": type,
            **({"metadata": metadata} if metadata else {})
        })

    def list(self, type: PeerType = None) -> List[Dict]:
        """
        List all peers in the workspace.

        Args:
            type (str): Optional filter by peer type ("user", "agent", "object").

        Returns:
            list: Array of peer objects.
        """
        params = {}
        if type:
            params["type"] = type
        return self._client._get("/api/peers", params=params)

    def get(self, peer_id: str) -> Dict:
        """
        Get a peer with their full profile (representations and sessions).

        Args:
            peer_id (str): UUID of the peer.

        Returns:
            dict: Peer object with representations and sessions arrays.
        """
        return self._client._get(f"/api/peers/{peer_id}")

    def update(self, peer_id: str, name: str = None, metadata: Dict = None) -> Dict:
        """
        Update a peer's name or metadata.

        Args:
            peer_id (str):  UUID of the peer.
            name (str):     New display name.
            metadata (dict): New metadata (replaces existing).

        Returns:
            dict: Updated peer object.
        """
        body = {}
        if name:
            body["name"] = name
        if metadata is not None:
            body["metadata"] = metadata
        return self._client._patch(f"/api/peers/{peer_id}", body)

    def delete(self, peer_id: str) -> Dict:
        """
        Delete a peer and all associated data (sessions, messages, representations).

        Args:
            peer_id (str): UUID of the peer.

        Returns:
            dict: {"success": True}
        """
        return self._client._delete(f"/api/peers/{peer_id}")


class SessionsResource:
    """CRUD operations for sessions (conversation threads)."""

    def __init__(self, client: "ContextMind"):
        self._client = client

    def create(self, peer_id: str, name: str = None, metadata: Dict = None) -> Dict:
        """
        Create a new session.

        A session is a conversation thread tied to a peer. Each session maintains
        its own message history, summaries, and context. One peer can have many sessions.

        Args:
            peer_id (str):      UUID of the peer this session belongs to.
            name (str):         Optional human-readable name (e.g. "Support ticket #1234").
            metadata (dict):    Optional metadata (e.g. {"channel": "web", "source": "chat"}).

        Returns:
            dict: Created session with id, peerId, messageCount, isActive, createdAt.

        Example:
            session = cm.sessions.create(
                peer_id=peer["id"],
                name="Onboarding chat",
                metadata={"channel": "web"}
            )
            # Store session["id"] — you'll need it for ingest and context calls
        """
        body: Dict[str, Any] = {"peerId": peer_id}
        if name:
            body["name"] = name
        if metadata:
            body["metadata"] = metadata
        return self._client._post("/api/sessions", body)

    def list(self, peer_id: str = None, is_active: bool = None) -> List[Dict]:
        """
        List sessions, optionally filtered.

        Args:
            peer_id (str):      Filter by peer UUID.
            is_active (bool):   Filter by active status.

        Returns:
            list: Array of session objects.
        """
        params = {}
        if peer_id:
            params["peerId"] = peer_id
        if is_active is not None:
            params["isActive"] = str(is_active).lower()
        return self._client._get("/api/sessions", params=params)

    def get(self, session_id: str) -> Dict:
        """
        Get a session with its full message history and summaries.

        Args:
            session_id (str): UUID of the session.

        Returns:
            dict: Session with messages and summaries arrays.
        """
        return self._client._get(f"/api/sessions/{session_id}")

    def update(self, session_id: str, name: str = None,
               is_active: bool = None, metadata: Dict = None) -> Dict:
        """Update a session."""
        body = {}
        if name is not None:
            body["name"] = name
        if is_active is not None:
            body["isActive"] = is_active
        if metadata is not None:
            body["metadata"] = metadata
        return self._client._patch(f"/api/sessions/{session_id}", body)

    def close(self, session_id: str) -> Dict:
        """
        Mark a session as inactive (closed).
        Closed sessions are retained in history but excluded from active queries by default.
        """
        return self.update(session_id, is_active=False)

    def delete(self, session_id: str) -> Dict:
        """Delete a session and all its messages and summaries."""
        return self._client._delete(f"/api/sessions/{session_id}")


class ContextMind:
    """
    ContextMind API client.

    Reduces LLM token burn by 90% through automatic conversation summarization,
    Theory of Mind extraction, and intelligent context assembly.

    Args:
        api_key (str):  Your workspace API key (starts with ctxmind_).
        base_url (str): API base URL. Defaults to http://localhost:3000 for local dev.
                        Set to your production URL in production.
        timeout (int):  Request timeout in seconds. Default: 30.

    Example:
        cm = ContextMind(
            api_key="ctxmind_your_key",
            base_url="https://your-contextmind.com"
        )
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "http://localhost:3000",
        timeout: int = 30
    ):
        if not api_key:
            raise AuthError("api_key is required")
        if not api_key.startswith("ctxmind_"):
            raise AuthError("Invalid API key format. Keys must start with ctxmind_")

        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

        self.peers = PeersResource(self)
        self.sessions = SessionsResource(self)

    def _headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": f"contextmind-python/{__version__}",
        }

    def _handle_response(self, response) -> Any:
        try:
            data = response.json()
        except Exception:
            data = {"error": response.text}

        if response.status_code == 401:
            raise AuthError(data.get("error", "Unauthorized"), 401, data.get("hint"))
        if response.status_code == 404:
            raise NotFoundError(data.get("error", "Not found"), 404, data.get("hint"))
        if response.status_code == 400:
            raise ValidationError(data.get("error", "Validation error"), 400, data.get("hint"))
        if not response.ok:
            raise ContextMindError(data.get("error", "API error"), response.status_code)
        return data

    def _get(self, path: str, params: Dict = None) -> Any:
        r = requests.get(f"{self.base_url}{path}", headers=self._headers(),
                         params=params, timeout=self.timeout)
        return self._handle_response(r)

    def _post(self, path: str, body: Dict) -> Any:
        r = requests.post(f"{self.base_url}{path}", headers=self._headers(),
                          json=body, timeout=self.timeout)
        return self._handle_response(r)

    def _patch(self, path: str, body: Dict) -> Any:
        r = requests.patch(f"{self.base_url}{path}", headers=self._headers(),
                           json=body, timeout=self.timeout)
        return self._handle_response(r)

    def _delete(self, path: str) -> Any:
        r = requests.delete(f"{self.base_url}{path}", headers=self._headers(),
                            timeout=self.timeout)
        return self._handle_response(r)

    def ingest(
        self,
        session_id: str,
        messages: List[Dict[str, str]],
        reasoning_level: ReasoningLevel = "medium"
    ) -> Dict:
        """
        Ingest conversation messages into ContextMind.

        This is the core write operation. Call this after each conversation turn
        or in bulk batches. ContextMind will:
          1. Count tokens and store each message
          2. Auto-generate a short summary every 20 messages (1K tokens)
          3. Auto-generate a long summary every 60 messages (4K tokens)
          4. Extract Theory of Mind representations at the specified reasoning level
          5. Generate vector embeddings for semantic search

        Args:
            session_id (str):           UUID of the session to ingest into.
            messages (list):            List of message dicts with required keys:
                                        - role: "user" | "assistant" | "system"
                                        - content: str (the message text)
                                        - metadata: dict (optional, arbitrary metadata)
            reasoning_level (str):      Depth of Theory of Mind extraction:
                                        - "minimal": Basic facts only, 90% confidence threshold
                                        - "low":     Standard recall, 80% threshold
                                        - "medium":  Balanced extraction, 70% threshold (default)
                                        - "high":    Complex insights, 60% threshold
                                        - "max":     Deep psychological profiling, 50% threshold

        Returns:
            dict with:
                success (bool):                 Always True on success.
                messageIds (list[str]):          UUIDs of the created messages.
                tokensIngested (int):            Total tokens counted across all messages.
                summaryGenerated (bool):         Whether a summary was auto-generated.
                representationsExtracted (int):  Number of new Theory of Mind insights extracted.
                cost (float):                    Cost in USD ($2 per million tokens).

        Raises:
            AuthError:      Invalid or missing API key.
            NotFoundError:  Session not found.
            ValidationError: Invalid message format or reasoning level.

        Example:
            result = cm.ingest(
                session_id="7c9e6679-...",
                messages=[
                    {"role": "user", "content": "I need help setting up CI/CD for my Python project"},
                    {"role": "assistant", "content": "Sure! Are you using GitHub Actions or GitLab CI?"},
                    {"role": "user", "content": "GitHub Actions. I'm a senior dev but new to Actions."},
                ],
                reasoning_level="medium"
            )
            print(f"Ingested {result['tokensIngested']} tokens, cost ${result['cost']:.8f}")
            print(f"Extracted {result['representationsExtracted']} new insights")
        """
        return self._post("/api/ingest", {
            "sessionId": session_id,
            "messages": messages,
            "reasoningLevel": reasoning_level,
        })

    def context(
        self,
        session_id: str,
        max_tokens: int = 8000,
        include_representations: bool = True,
        include_documents: bool = True,
        query: str = None,
    ) -> ContextResponse:
        """
        Retrieve compressed, token-optimised context for a session.

        Call this before every LLM API call instead of fetching full message history.
        ContextMind applies a 60/40 token budget split and returns the most relevant
        context within your budget.

        Budget allocation:
          - 60% → Recent verbatim messages (most recent messages that fit)
          - 40% → Compressed summary (latest auto-generated summary)
          - Plus: Theory of Mind representations (minimal token overhead)

        Args:
            session_id (str):               UUID of the session.
            max_tokens (int):               Total token budget (default: 8000, max: 32000).
            include_representations (bool): Include Theory of Mind profile (default: True).
            include_documents (bool):       Include semantic document matches (default: True).
            query (str):                    Optional semantic search query. When provided,
                                            ContextMind finds the most relevant summaries
                                            and documents using cosine similarity.

        Returns:
            ContextResponse with:
                recent_messages (list):     Verbatim messages fitting the 60% budget.
                summary (str|None):         Latest summary fitting the 40% budget.
                representations (list):     Theory of Mind insights, ordered by confidence.
                relevant_documents (list):  Semantically matched documents.
                total_tokens (int):         Total tokens in the returned context.
                compression_ratio (float):  Context tokens / full history tokens.
                savings_percent (float):    Convenience: (1 - compression_ratio) * 100.

        Example:
            ctx = cm.context(session_id="7c9e6679-...", max_tokens=8000)

            print(f"Token savings: {ctx.savings_percent}%")
            print(f"Summary: {ctx.summary}")

            # Use with OpenAI directly:
            messages = ctx.to_openai_messages("You are a helpful coding assistant.")
            response = openai.chat.completions.create(model="gpt-4o", messages=[
                *messages,
                {"role": "user", "content": user_message}
            ])
        """
        params: Dict[str, Any] = {
            "sessionId": session_id,
            "maxTokens": max_tokens,
            "includeRepresentations": str(include_representations).lower(),
            "includeDocuments": str(include_documents).lower(),
        }
        if query:
            params["query"] = query
        data = self._get("/api/context", params=params)
        return ContextResponse(data)

    def infer(
        self,
        peer_id: str,
        question: str,
        keys: List[str] = None,
    ) -> InferResponse:
        """
        Query a peer's psychological profile using natural language (Infer API).

        ContextMind reasons over all accumulated Theory of Mind representations
        for this peer and synthesizes a direct answer to your question. Use this
        to personalise your application, adapt UI/UX, or pre-configure LLM prompts.

        Args:
            peer_id (str):      UUID of the peer to query.
            question (str):     Natural language question about the peer (max 500 chars).
            keys (list[str]):   Optional list of representation keys to limit inference to.
                                E.g. ["communication_style", "expertise"] to only use
                                those two profiles. Omit to use all available data.

        Returns:
            InferResponse with:
                answer (str):               Synthesized answer about the peer.
                confidence (int):           Average confidence of source representations (0-100).
                sourced_from (list[str]):   Keys of representations used in the answer.
                peer_name (str):            Display name of the queried peer.
                total_representations (int): Total number of representations in profile.

        Raises:
            AuthError:      Invalid or missing API key.
            NotFoundError:  Peer not found.

        Example:
            # After ingesting a few conversations with reasoning_level="medium":
            result = cm.infer(
                peer_id="550e8400-...",
                question="How should I explain technical concepts to this user?"
            )
            print(result.answer)
            # → "Alice is a senior Python engineer. Skip basics, use code examples,
            #    keep explanations to 2-3 sentences. She dislikes verbose prose."
            print(f"Confidence: {result.confidence}%")
            print(f"Based on: {result.sourced_from}")
        """
        body: Dict[str, Any] = {"peerId": peer_id, "question": question}
        if keys:
            body["keys"] = keys
        data = self._post("/api/infer", body)
        return InferResponse(data)
