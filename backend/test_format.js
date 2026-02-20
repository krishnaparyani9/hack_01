function formatStructuredData(structured) {
    const formatArray = (label, items) => {
        if (!items) return '';
        let arr = [];
        if (Array.isArray(items)) arr = items;
        else if (typeof items === 'string' && items.trim()) arr = [items.trim()];

        if (!arr.length) return '';
        return `**${label}:**\n${arr.map((it) => `• ${it}`).join('\n')}\n\n`;
    };

    let result = '';

    if (structured) {
        if (structured.chief_complaint) result += `**Chief Complaint:** ${structured.chief_complaint}\n\n`;
        if (structured.duration) result += `**Duration:** ${structured.duration}\n\n`;

        if (typeof structured.summary === 'string' && structured.summary.trim()) {
            const title = structured.method === 'heuristic' ? 'Raw Extracted Excerpts' : 'Overview';
            result += `**${title}:**\n${structured.summary.trim()}\n\n`;
        }

        result += formatArray('Key Findings', structured.key_findings || structured.keyFindings);
        result += formatArray('Important Readings', structured.important_readings || structured.importantReadings || structured.readings);
        result += formatArray('Threats / Concerns', structured.threats || structured.concerns);
        result += formatArray('Doctor Recommendations', structured.recommendations || structured.recommendation);
        result += formatArray('Future Precautions', structured.precautions || structured.future_precautions);
    }

    if (!result.trim()) {
        return (structured && structured.summary) ? String(structured.summary) : 'No summary data extracted.';
    }

    return result.trim();
}

console.log(formatStructuredData({
    "chief_complaint": "",
    "duration": "",
    "key_findings": ["Lab No. DUMMYH243"],
    "summary": "A 26-year-old male reported AREZT. The report is final.",
    "important_readings": ["AREZT"],
    "threats": [],
    "precautions": [],
    "recommendations": []
}));
