/** Submit native Gemini content with the selected model's search capability. */
export async function requestGeminiContent(model, contents, systemInstruction) {
  const baseURL = model.baseURL.trim().replace(/\/+$/, "").replace(/\/v1beta\/openai$|\/v1(?:beta)?$/, "");
  const response = await fetch(`${baseURL}/v1beta/models/${encodeURIComponent(model.model.replace(/^models\//, ""))}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(model.apiKey ? { Authorization: `Bearer ${model.apiKey}`, "x-goog-api-key": model.apiKey } : {}) },
    body: JSON.stringify({ contents, ...(systemInstruction ? { systemInstruction } : {}), ...(model.webSearch === true ? { tools: [{ googleSearch: {} }] } : {}) }),
    signal: AbortSignal.timeout(model.timeoutSeconds * 1000),
  });
  if (!response.ok) throw new Error(`Gemini 请求失败：HTTP ${response.status}，请确认接口支持 Gemini 原生 API。`);
  const completion = await response.json();
  const candidate = completion.candidates?.[0];
  if (candidate?.finishReason !== "STOP") throw new Error(`Gemini 生成未完整结束：${candidate?.finishReason ?? "无有效结果"}`);
  return (candidate.content?.parts ?? []).filter((part) => !part.thought && typeof part.text === "string").map((part) => part.text).join("");
}
