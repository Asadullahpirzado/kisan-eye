import { useEffect, useState } from "react";
import ChatBubble from "../components/ChatBubble.jsx";
import { submitAssessment } from "../api.js";

const THINKING_LINES = [
  "Reviewing your answers",
  "Comparing with the visual evidence",
  "Working out the risk level",
  "Putting together an action plan",
];

export default function Investigation({ analysisData, onComplete, onBack }) {
  const { crop, prediction, questions, needs_escalation, escalation_message, image_path } = analysisData;

  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredLog, setAnsweredLog] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const [thinkingLine, setThinkingLine] = useState(THINKING_LINES[0]);
  const [errorMessage, setErrorMessage] = useState("");

  const currentQuestion = questions[questionIndex];
  const allAnswered = questionIndex >= questions.length;

  useEffect(() => {
    if (!finishing) return;
    let i = 0;
    const timer = setInterval(() => {
      i = Math.min(i + 1, THINKING_LINES.length - 1);
      setThinkingLine(THINKING_LINES[i]);
    }, 500);
    return () => clearInterval(timer);
  }, [finishing]);

  useEffect(() => {
    if (needs_escalation) return;
    if (allAnswered && questions.length > 0) {
      finalize(answers);
    }
    if (questions.length === 0 && !needs_escalation) {
      finalize({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered]);

  async function finalize(finalAnswers) {
    setFinishing(true);
    try {
      const result = await submitAssessment({
        crop,
        image_path,
        prediction,
        answers: finalAnswers,
      });
      setTimeout(() => onComplete(result), THINKING_LINES.length * 500);
    } catch (err) {
      setErrorMessage(err.message || "Could not finish the assessment.");
      setFinishing(false);
    }
  }

  function pickAnswer(option) {
    const updated = { ...answers, [currentQuestion.id]: option };
    setAnswers(updated);
    setAnsweredLog((log) => [...log, { prompt: currentQuestion.prompt, answer: option }]);
    setQuestionIndex((i) => i + 1);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-12">
      <h1 className="text-2xl font-bold text-forest mb-1">AI investigation</h1>
      <p className="text-forest/60 mb-8">KISAN EYE is looking a little closer before finishing the assessment.</p>

      <div className="space-y-5">
        <ChatBubble from="agent">
          I found a possible match with <strong>{prediction.label}</strong> at{" "}
          {prediction.confidence}% confidence.{" "}
          {needs_escalation
            ? "That's not confident enough for a reliable read yet."
            : "Let me ask a couple of quick questions before finishing the assessment."}
        </ChatBubble>

        {needs_escalation && (
          <>
            <ChatBubble from="agent">{escalation_message}</ChatBubble>
            <div className="pt-2">
              <button
                onClick={onBack}
                className="rounded-full bg-forest text-canvas px-6 py-3 font-semibold hover:bg-leaf transition-colors"
              >
                Upload a clearer photo
              </button>
            </div>
          </>
        )}

        {!needs_escalation &&
          answeredLog.map((item, i) => (
            <div key={i} className="space-y-3">
              <ChatBubble from="agent">{item.prompt}</ChatBubble>
              <ChatBubble from="farmer">{item.answer}</ChatBubble>
            </div>
          ))}

        {!needs_escalation && !allAnswered && currentQuestion && (
          <div className="space-y-3">
            <ChatBubble from="agent">{currentQuestion.prompt}</ChatBubble>
            <div className="flex flex-wrap gap-2 pl-11">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => pickAnswer(option)}
                  className="rounded-full border border-forest/20 px-4 py-2 text-sm font-medium text-forest hover:border-leaf hover:text-leaf transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {finishing && (
          <ChatBubble from="agent">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              {thinkingLine}...
            </span>
          </ChatBubble>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-danger/5 border border-danger/20 px-5 py-4 text-sm text-forest/80">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
