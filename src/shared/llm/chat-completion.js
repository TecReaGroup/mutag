/** Execute the shared completion protocol and return validated message text. */
export async function requestChatCompletion(model, messages, signal) {
  const timeout = AbortSignal.timeout(model.timeoutSeconds * 1000);
  const response = await fetch(`${model.baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(model.apiKey ? { Authorization: `Bearer ${model.apiKey}` } : {}),
    },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    body: JSON.stringify({ model: model.model, messages }),
  });
  if (!response.ok) throw new Error(`LLM 请求失败：HTTP ${response.status}`);
  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("LLM 未返回对话内容。");
  return content;
}
