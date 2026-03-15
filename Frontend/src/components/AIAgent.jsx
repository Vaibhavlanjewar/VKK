import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import API from '../api/api.js'; 
import './AIAgent.css';

const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // 1. Auto-scroll to bottom whenever summary changes
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [summary, loading, isOpen]);

  // 2. The Logic to Ask AI or Get Summary
  const handleAction = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (input.trim()) {
        // Handle custom prompt from the input box
        const res = await API.post("/ai/ask", { question: input });
        setSummary(res.data.answer);
        setInput("");
      } else {
        // Handle the general summary (Refresh button)
        const res = await API.get("/ai/summary");
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setSummary("❌ Service unavailable. Please check your internet or API quota.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Pro Formatted TXT Download
  const downloadReport = () => {
    if (!summary) return;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    const header = `***********************************************************\n                VAIBHAV KRISHI KENDRA\n              BUSINESS ANALYTICS REPORT\n***********************************************************\nReport Generated: ${date} | ${time}\n-----------------------------------------------------------\n`;

    let cleanBody = summary
      .replace(/###/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '  •')
      .replace(/✨|💰|📦|📈|⚠️/g, '')
      .trim();

    cleanBody = cleanBody
      .replace(/Finance Overview/g, '\nFINANCIAL OVERVIEW\n------------------')
      .replace(/Inventory Status/g, '\nINVENTORY STATUS\n----------------')
      .replace(/Admin Insight/g, '\nADMINISTRATIVE INSIGHTS\n-----------------------')
      .replace(/Business Intelligence \(Demo Mode\)/g, 'SYSTEM STATUS: DEMO MODE (QUOTA LIMITED)');

    const footer = `\n-----------------------------------------------------------\n          End of Automated Business Intelligence\n***********************************************************`;

    const element = document.createElement("a");
    const file = new Blob([header + cleanBody + footer], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `VKK_Report_${date.replace(/\//g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`ai-agent-container ${isOpen ? 'active' : ''}`}>
      {/* Floating Toggle Bubble */}
      <div className="ai-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '✨'}
      </div>

      {isOpen && (
        <div className="ai-window">
          {/* Header Area */}
          <div className="ai-header">
            <h4>Vaibhav Krishi Assistant</h4>
            <div className="header-controls">
              {summary && (
                <button onClick={downloadReport} className="download-btn" title="Download as Text">
                  📥
                </button>
              )}
              <button onClick={() => { setSummary(""); handleAction(); }} className="refresh-btn" disabled={loading}>
                {loading ? "..." : "🔄"}
              </button>
            </div>
          </div>

          {/* Chat/Body Area */}
          <div className="ai-body">
            <div className="ai-content-render">
              <ReactMarkdown>{summary || "Ask me about your inventory, bills, or market trends!"}</ReactMarkdown>
            </div>
            {loading && <div className="typing-indicator">Analyzing data...</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form className="ai-footer" onSubmit={handleAction}>
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about bills, stock..." 
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAgent;