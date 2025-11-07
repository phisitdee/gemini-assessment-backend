<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Writing Assessment Tool</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- ใช้ฟอนต์ Noto Sans Thai สำหรับภาษาไทย -->
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            /* กำหนดให้ Inter เป็นฟอนต์หลัก และ Noto Sans Thai เป็นฟอนต์รองสำหรับภาษาไทย */
            font-family: 'Inter', 'Noto Sans Thai', sans-serif;
        }
        .progress-ring__circle {
            transition: stroke-dashoffset 0.35s;
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
        }
    </style>
</head>
<body class="bg-gray-100 dark:bg-gray-900 h-full flex items-center justify-center p-4">
    <div class="w-full max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div class="p-8">
                <!-- ส่วนหัวเรื่องและ UI เหมือนเดิม -->
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Writing Assessment AI</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">Assess student essays on "Sharing Experiences" using the Present Perfect Tense.</p>
                    </div>
                     <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gem" viewBox="0 0 16 16"><path d="M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.199.224.458.224.716v1.284a.5.5 0 0 1-.224.416l-3.976 2.982a.5.5 0 0 1-.576 0l-3.976-2.982a.5.5 0 0 1-.224-.416V5.39c0-.258.075-.517.224-.716zm-1.803.41-1.13.448L.023 2.186a.5.5 0 0 1 .224-.416l3.976-2.982a.5.5 0 0 1 .576 0l3.976 2.982a.5.5 0 0 1 .224.416l-1.13.448zM16 2.185l-1.276-.51-1.131-.448a.5.5 0 0 0-.4.2L10.024 5.39v1.284a.5.5 0 0 0 .224.416l3.976 2.982a.5.5 0 0 0 .576 0l3.976-2.982a.5.5 0 0 0 .224-.416V2.186zM1.13 1.686l-1.13.448L.023 3.42a.5.5 0 0 0 .224.416l3.976 2.982a.5.5 0 0 0 .576 0l3.976-2.982a.5.5 0 0 0 .224-.416L8.13 1.686l-1.13-.448a.5.5 0 0 0-.4-.2h-3a.5.5 0 0 0-.4.2zM15 4.39l-1.276-.51-1.131-.448a.5.5 0 0 0-.4.2L9.024 7.39v1.284a.5.5 0 0 0 .224.416l3.976 2.982a.5.5 0 0 0 .576 0l3.976-2.982a.5.5 0 0 0 .224-.416V4.39z"/></svg>
                        <span>Powered by Gemini</span>
                    </div>
                </div>
                <div class="mt-8">
                    <label for="student-essay" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student's Essay (min. 100 words)</label>
                    <div class="relative">
                        <textarea id="student-essay" rows="12" class="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200 transition-shadow" placeholder="Paste the student's essay here..."></textarea>
                        <div id="word-count" class="absolute bottom-3 right-3 text-sm text-gray-400 dark:text-gray-500">0 words</div>
                    </div>
                </div>
                <div class="mt-6 text-center">
                    <button id="assess-button" class="w-full md:w-auto bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto">
                        <span id="button-text">Assess Writing</span>
                        <svg id="button-spinner" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </button>
                </div>
            </div>
            <!-- ส่วนแสดงผลลัพธ์ -->
            <div id="results-section" class="bg-gray-50 dark:bg-gray-800/50 p-8 border-t border-gray-200 dark:border-gray-700 hidden">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">Assessment Results</h2>
                <div id="error-message" class="hidden bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md mb-6" role="alert">
                    <p class="font-bold">Error</p>
                    <p id="error-text"></p>
                </div>
                <div id="results-content" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-6">
                        <div class="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><span class="font-medium text-gray-600 dark:text-gray-300">Structure</span><span id="structure-score" class="font-bold text-lg text-indigo-600 dark:text-indigo-400">-/5</span></div>
                        <div class="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><span class="font-medium text-gray-600 dark:text-gray-300">Accuracy (Present Perfect)</span><span id="accuracy-score" class="font-bold text-lg text-indigo-600 dark:text-indigo-400">-/5</span></div>
                        <div class="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm"><span class="font-medium text-gray-600 dark:text-gray-300">Relevance to Topic</span><span id="relevance-score" class="font-bold text-lg text-indigo-600 dark:text-indigo-400">-/5</span></div>
                    </div>
                    <div class="flex flex-col gap-6">
                       <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm text-center flex flex-col items-center justify-center">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Score</h3>
                             <div class="relative w-32 h-32 mt-2">
                                <svg class="w-full h-full" viewBox="0 0 36 36">
                                    <path class="text-gray-200 dark:text-gray-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3" />
                                    <path id="score-ring" class="text-indigo-600 dark:text-indigo-400 progress-ring__circle" stroke-width="3" fill="none" stroke-linecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke-dasharray="100, 100" stroke-dashoffset="100" />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center"><span id="total-score" class="text-4xl font-bold text-gray-800 dark:text-white">--</span><span class="text-lg text-gray-500 dark:text-gray-400">/15</span></div>
                            </div>
                        </div>
                    </div>
                     <div class="md:col-span-2 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Areas for Improvement</h3>
                            <button id="rewrite-button" class="hidden bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                 <span id="rewrite-button-text">✨ Rewrite with AI</span>
                                 <svg id="rewrite-spinner" class="animate-spin h-4 w-4 text-purple-700 dark:text-purple-300 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            </button>
                        </div>
                        <div id="feedback" class="text-gray-600 dark:text-gray-300 space-y-2 prose prose-sm dark:prose-invert"><p>Feedback will be generated here...</p></div>
                        <div id="rewrite-section" class="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4 hidden">
                            <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-2">✨ AI-Suggested Rewrite</h4>
                            <div id="rewritten-text" class="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-md text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-serif"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

<script>
    // ส่วนของ UI elements
    const studentEssay = document.getElementById('student-essay');
    const assessButton = document.getElementById('assess-button');
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const wordCountEl = document.getElementById('word-count');
    const structureScoreEl = document.getElementById('structure-score');
    const accuracyScoreEl = document.getElementById('accuracy-score');
    const relevanceScoreEl = document.getElementById('relevance-score');
    const totalScoreEl = document.getElementById('total-score');
    const feedbackEl = document.getElementById('feedback');
    const scoreRing = document.getElementById('score-ring');
    const rewriteButton = document.getElementById('rewrite-button');
    const rewriteButtonText = document.getElementById('rewrite-button-text');
    const rewriteSpinner = document.getElementById('rewrite-spinner');
    const rewriteSection = document.getElementById('rewrite-section');
    const rewrittenText = document.getElementById('rewritten-text');
    let currentFeedbackText = "";

    // ตั้งค่ากราฟวงกลม
    const circumference = scoreRing.getTotalLength();
    scoreRing.style.strokeDasharray = `${circumference} ${circumference}`;
    scoreRing.style.strokeDashoffset = circumference;
    
    function setProgress(percent) {
        const offset = circumference - (percent / 100) * circumference;
        scoreRing.style.strokeDashoffset = offset;
    }

    // นับจำนวนคำ
    studentEssay.addEventListener('input', () => {
        const text = studentEssay.value;
        const words = text.trim().split(/\s+/).filter(Boolean);
        const count = words.length;
        wordCountEl.textContent = `${count} words`;
    });

    // กำหนด Event Listeners
    assessButton.addEventListener('click', callCloudFunction);
    rewriteButton.addEventListener('click', callCloudFunction);
    
    // ** ฟังก์ชันหลักที่แก้ไขแล้ว **
    // ฟังก์ชันนี้จะเรียก Cloud Function ของเรา (ที่อยู่บน Google Cloud)
    async function callCloudFunction(event) {
        const essayText = studentEssay.value;
        if (!essayText.trim()) {
            showError("Please enter the student's essay before assessing.");
            return;
        }

        // --- นี่คือ URL จริงของ "หลังร้าน" ของคุณครูครับ ---
        const CLOUD_FUNCTION_URL = 'https://assessessay-761741684216.asia-southeast1.run.app'; 

        const isRewrite = event.currentTarget.id === 'rewrite-button';

        if (isRewrite) {
            setRewriteLoadingState(true);
        } else {
            setLoadingState(true);
            resetUI();
            resultsSection.classList.remove('hidden');
        }

        try {
            // เราจะส่ง "เรียงความ" และ "คำสั่ง" (assess หรือ rewrite) ไปให้ "หลังร้าน"
            const payload = {
                essayText: essayText,
                action: isRewrite ? 'rewrite' : 'assess',
                feedbackForRewrite: isRewrite ? currentFeedbackText : ''
            };

            // ใช้ 'fetch' เพื่อเรียก "หลังร้าน" ของเรา
            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload), // ส่งข้อมูลเป็น JSON
            });

            if (!response.ok) {
                // ถ้า "หลังร้าน" ตอบกลับมาว่ามีปัญหา
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            // ถ้าสำเร็จ "หลังร้าน" จะส่งผลลัพธ์กลับมา
            const result = await response.json();

            // แสดงผลลัพธ์ตามประเภทของคำสั่ง
            if (isRewrite) {
                rewrittenText.textContent = result.rewrittenText;
                rewriteSection.classList.remove('hidden');
            } else {
                displayResults(result);
            }

        } catch (error) {
            console.error("Error calling Cloud Function:", error);
            showError(`An error occurred. ${error.message}`);
        } finally {
             // หยุดการหมุน
             if (isRewrite) {
                setRewriteLoadingState(false);
            } else {
                setLoadingState(false);
            }
        }
    }
    
    // ฟังก์ชันสำหรับรีเซ็ต UI
    function resetUI() {
        structureScoreEl.textContent = '-/5';
        accuracyScoreEl.textContent = '-/5';
        relevanceScoreEl.textContent = '-/5';
        totalScoreEl.textContent = '--';
        feedbackEl.innerHTML = '<p>Feedback will be generated here...</p>';
        setProgress(0);
        errorMessage.classList.add('hidden');
        rewriteButton.classList.add('hidden');
        rewriteSection.classList.add('hidden');
        currentFeedbackText = "";
    }

    // ฟังก์ชันสำหรับแสดงผลลัพธ์
    function displayResults(data) {
        resultsContent.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        // ตรวจสอบให้แน่ใจว่าค่าที่ได้เป็นตัวเลข
        const structureScore = Number(data.structureScore) || 0;
        const accuracyScore = Number(data.accuracyScore) || 0;
        const relevanceScore = Number(data.relevanceScore) || 0;
        const totalScore = structureScore + accuracyScore + relevanceScore;

        structureScoreEl.textContent = `${structureScore}/5`;
        accuracyScoreEl.textContent = `${accuracyScore}/5`;
        relevanceScoreEl.textContent = `${relevanceScore}/5`;
        totalScoreEl.textContent = totalScore;
        
        const maxScore = 15;
        const scorePercentage = (totalScore / maxScore) * 100;
        setProgress(scorePercentage);
        
        currentFeedbackText = data.feedback;
        // แปลง feedback (ที่อาจจะเป็น * item1 * item2) ให้เป็น <li>
        const feedbackHtml = '<ul>' + data.feedback.split('* ').filter(item => item.trim() !== '').map(item => `<li class="ml-4 pl-2 list-disc">${item.trim()}</li>`).join('') + '</ul>';
        feedbackEl.innerHTML = feedbackHtml;
        rewriteButton.classList.remove('hidden');
    }

    // ฟังก์ชันสำหรับแสดง Error
    function showError(message) {
        resultsContent.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = message;
    }

    // ฟังก์ชันสำหรับสถานะ Loading (ปุ่ม Assess)
    function setLoadingState(isLoading) {
        assessButton.disabled = isLoading;
        buttonText.classList.toggle('hidden', isLoading);
        buttonSpinner.classList.toggle('hidden', !isLoading);
    }

    // ฟังก์ชันสำหรับสถานะ Loading (ปุ่ม Rewrite)
    function setRewriteLoadingState(isLoading) {
        rewriteButton.disabled = isLoading;
        rewriteButtonText.classList.toggle('hidden', isLoading);
        rewriteSpinner.classList.toggle('hidden', !isLoading);
    }
</script>
</body>
</html>
