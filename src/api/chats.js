// src/api/chats.js
import { request, DEMO } from "./client.js";

function convertMessageToFrontend(msg) {
  if (!msg) return null;
  return {
    id: msg.id || `msg_${Date.now()}`,
    role: msg.role || "assistant",
    text: msg.content || "",
    content: msg.content || "",
    sources: msg.sources || [],
    groundedness: msg.groundedness || null,
    timestamp: msg.created_at || new Date().toISOString(),
    processing_time: msg.processing_time || 0,
  };
}

export async function createChat(title, firstMessage = null) {
  const response = await request("/api/v1/chats", {
    method: "POST",
    body: { title, first_message: firstMessage },
  });
  return response;
}

export async function listChats(skip = 0, limit = 50) {
  const response = await request(`/api/v1/chats?skip=${skip}&limit=${limit}`);
  return response;
}

export async function getChat(id) {
  const response = await request(`/api/v1/chats/${id}`);
  if (response.messages && Array.isArray(response.messages)) {
    response.messages = response.messages
      .map(convertMessageToFrontend)
      .filter((msg) => msg !== null);
  } else {
    response.messages = [];
  }
  return response;
}

export async function renameChat(id, title) {
  const response = await request(`/api/v1/chats/${id}`, {
    method: "PATCH",
    body: { title },
  });
  return response;
}

export async function deleteChat(id) {
  const response = await request(`/api/v1/chats/${id}`, {
    method: "DELETE",
  });
  return response;
}

export async function clearChats() {
  const response = await request("/api/v1/chats", {
    method: "DELETE",
  });
  return response;
}

export async function sendMessage(id, content, language = "en") {
  const response = await request(`/api/v1/chats/${id}/messages`, {
    method: "POST",
    body: { content, language },
  });
  if (response.assistant_message) {
    response.assistant_message = convertMessageToFrontend(
      response.assistant_message,
    );
  }
  if (response.user_message) {
    response.user_message = convertMessageToFrontend(response.user_message);
  }
  return response;
}

// Pulls every saved question/answer pair across all of the user's chats
// (paginated). Used for the "Export" action in ChatHistoryMenu.
export async function exportAllQA(
  skip = 0,
  limit = 1000,
  includePending = false,
) {
  const response = await request(
    `/api/v1/chats/export/qa?skip=${skip}&limit=${limit}&include_pending=${includePending}`,
  );
  return response;
}

export async function streamMessage(id, content, language = "en", onToken) {
  const token =
    localStorage.getItem("token") || localStorage.getItem("api_key");
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  const response = await fetch(`${API_BASE}/api/v1/chats/${id}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, language }),
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            onToken(data.text);
          }
          if (data.done) {
            return;
          }
        } catch (e) {}
      }
    }
  }
}
