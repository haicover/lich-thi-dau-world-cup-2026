const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    const issueTitle = process.env.ISSUE_TITLE;
    const issueBody = process.env.ISSUE_BODY;
    const issueNumber = process.env.ISSUE_NUMBER;

    if (!apiKey) {
        console.error("LỖI: Thiếu cấu hình GEMINI_API_KEY trong repository Secrets.");
        process.exit(1);
    }

    console.log(`=== Đang chạy tác vụ sửa lỗi tự động cho Issue #${issueNumber}: "${issueTitle}" ===`);

    // Danh sách các file ngữ cảnh quan trọng của dự án
    const filesToContext = [
        'app.js', 
        'style.css', 
        'teams.json', 
        'venues.json', 
        'squads.json', 
        'index.html'
    ];
    
    let codebaseContext = '';
    filesToContext.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            codebaseContext += `\n\n--- FILE: ${file} ---\n${content}\n--- END OF FILE ---`;
        }
    });

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
Bạn là một AI Software Engineer xuất sắc. Nhiệm vụ của bạn là sửa lỗi hoặc triển khai tính năng theo mô tả của Issue dưới đây:

[MÔ TẢ ISSUE]
Tiêu đề: ${issueTitle}
Nội dung: ${issueBody}

[MÃ NGUỒN HIỆN TẠI CỦA DỰ ÁN]
${codebaseContext}

Yêu cầu:
1. Hãy tìm chính xác tệp tin cần sửa đổi trong các file ngữ cảnh ở trên.
2. Thực hiện sửa đổi mã nguồn để giải quyết triệt để và an toàn nhất cho yêu cầu trong Issue.
3. Trả về kết quả dưới dạng JSON chính xác theo cấu trúc sau (không kèm ký tự markdown hoặc văn bản giải thích thừa bên ngoài khối JSON):
{
  "targetFile": "tên_tệp_tin_cần_sửa.js",
  "newContent": "toàn_bộ_nội_dung_mới_sau_khi_đã_sửa_đổi_tệp_tin_đó"
}
`;

    try {
        console.log("Đang gửi yêu cầu phân tích mã nguồn và sửa lỗi tới Gemini API...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const resultText = response.text.trim();
        const result = JSON.parse(resultText);

        if (result.targetFile && result.newContent) {
            const targetPath = path.join(process.cwd(), result.targetFile);
            fs.writeFileSync(targetPath, result.newContent, 'utf8');
            console.log(`🎉 Thành công! AI Agent đã sửa đổi và ghi đè tệp tin: ${result.targetFile}`);
        } else {
            console.error("LỖI: Gemini phản hồi không đúng cấu trúc targetFile và newContent.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Lỗi nghiêm trọng trong quá trình AI Agent hoạt động:", error);
        process.exit(1);
    }
}

main();
