import fetch from 'node-fetch';

async function test() {
    const text = `LPL - PRODUCTION TEST COLLECTION; SECTOR - 18, BLOCK-E ROHINI; ELH 110085; Name DuMMY Collected 20572021 1:37:00AM; Received 20/5/2021 4:28:11PM; Lab No. DUMMYH243 Age: 26 Years Gender: Male. Reported AREZT. SHOW; Acstatus P RefBy: DR.DUMMY DUMMY Report Status Final; Test Name Results units Bio. Ret. Interval`;

    const enhancedText = `${text}\n\n[INSTRUCTION ENFORCEMENT]: Also ensure the JSON response includes the following arrays of strings if found in the text: "important_readings", "threats", "precautions", and "recommendations". Focus on threatening readings and future precautions.`;

    const form = new URLSearchParams();
    form.append('text', enhancedText);

    console.log("sending to modal...");
    const res = await fetch('https://parth50-del--gemma3-summarizer-fastapi.modal.run/summarize', {
        method: 'POST',
        body: form,
    });

    const data = await res.json();
    console.log(data);
}

test();
