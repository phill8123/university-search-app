
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, '..', '2025년 고등 학교별X학과별 입학정원 지원 입학 학생 외국학생 졸업 교원_250828H-1.csv');
const outFilePath = path.join(__dirname, '..', 'services', 'universityDataGenerated.ts');

async function processLineByLine() {
    const fileStream = fs.createReadStream(csvFilePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // Name -> { location, type, tier, estMetic, colleges: { category: [depts] } }
    const universities = new Map();

    let lineCount = 0;

    for await (const line of rl) {
        lineCount++;
        if (lineCount < 16) continue; // Skip headers

        // Simple CSV parser handling quotes
        const columns = [];
        let inQuotes = false;
        let currentVal = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        columns.push(currentVal.trim());

        if (columns.length < 22) continue;

        const year = columns[0];
        const schoolType = columns[1];
        const univName = columns[4];
        const locationStr = columns[7] || '';
        const location = locationStr.split(' ')[0]; // '강원 강릉시' -> '강원'
        const type = columns[9];
        const courseType = columns[16];
        const stdLarge = columns[17] || '기타';
        const stdMiddle = columns[18] || '';
        const deptCategory = stdMiddle ? `${stdLarge} - ${stdMiddle}` : stdLarge;
        const deptName = columns[21];

        if (!universities.has(univName)) {
            universities.set(univName, {
                name: univName,
                location: location,
                type: type,
                schoolType: schoolType,
                tier: 'Regional',
                estMetic: 99,
                colleges: {},
                deptCategories: {}
            });
        }

        const univ = universities.get(univName);

        // Group by Large Category for 'colleges' structure (keep existing logic for grouping)
        if (!univ.colleges[stdLarge]) {
            univ.colleges[stdLarge] = [];
        }

        if (!univ.colleges[stdLarge].includes(deptName)) {
            univ.colleges[stdLarge].push(deptName);
        }

        // Store specific category mapping
        if (!univ.deptCategories) univ.deptCategories = {};
        univ.deptCategories[deptName] = deptCategory;

        // Capture Admission Stats
        const recruitStr = columns[23] || '0';
        const applicantStr = columns[24] || '0';
        const recruit = parseFloat(recruitStr.replace(/,/g, ''));
        const applicants = parseFloat(applicantStr.replace(/,/g, ''));

        let competitionRate = 0;
        if (recruit > 0) competitionRate = applicants / recruit;

        // Store properly formatted stats
        if (!univ.stats) univ.stats = {};
        univ.stats[deptName] = {
            recruit: recruit,
            applicants: applicants,
            rate: competitionRate.toFixed(2)
        };
    }

    // Generate TS Code
    let output = `import { UniversityStructure } from './universityData';\n\n`;
    output += `export const generatedUniversitiesDB: UniversityStructure[] = [\n`;

    for (const [name, data] of universities) {
        // Basic Tier Heuristics (Preserve previously added logic)
        if (['서울대학교', '연세대학교', '고려대학교'].includes(name)) { data.tier = 'SKY'; data.estMetic = 1; }
        else if (['한국과학기술원', '울산과학기술원', '광주과학기술원', '대구경북과학기술원', '포항공과대학교', '한국에너지공과대학교'].includes(name)) { data.tier = 'SKY'; data.estMetic = 0; }
        else if (['서강대학교', '성균관대학교', '한양대학교', '이화여자대학교', '중앙대학교', '경희대학교', '한국외국어대학교', '서울시립대학교', '건국대학교', '동국대학교', '홍익대학교'].includes(name)) { data.tier = 'Top15'; data.estMetic = 10; }
        else if (['한국예술종합학교'].includes(name)) { data.tier = 'Top15'; data.estMetic = 5; }
        else if (data.schoolType === '교육대학') { data.tier = 'Edu'; data.estMetic = 15; }
        else if (name.includes('교육대학교')) { data.tier = 'Edu'; data.estMetic = 15; }
        else if (name === '한국교원대학교') { data.tier = 'Edu'; data.estMetic = 15; }
        else if (data.location === '서울') { data.tier = 'InSeoul'; data.estMetic = 20; }
        else if (data.location === '경기' || data.location === '인천') { data.tier = 'Metro'; data.estMetic = 30; }
        else if (data.type === '국립' || data.type === '국립대법인' || data.type === '특별법국립' || data.type === '특별법법인') { data.tier = 'National'; data.estMetic = 40; }

        output += `  {\n`;
        output += `    name: "${name}",\n`;
        output += `    location: "${data.location}",\n`;
        output += `    type: "${data.type}",\n`;
        output += `    tier: "${data.tier}",\n`;
        output += `    estMetic: ${data.estMetic},\n`;
        output += `    colleges: {\n`;
        for (const [cat, depts] of Object.entries(data.colleges)) {
            output += `      "${cat}": [${depts.map(d => `"${d}"`).join(', ')}],\n`;
        }
        output += `    },\n`;

        output += `    deptCategories: {\n`;
        if (data.deptCategories) {
            for (const [dept, cat] of Object.entries(data.deptCategories)) {
                output += `      "${dept}": "${cat}",\n`;
            }
        }
        output += `    },\n`;

        output += `    stats: {\n`;
        if (data.stats) {
            for (const [dept, stat] of Object.entries(data.stats)) {
                output += `      "${dept}": { recruit: ${stat.recruit}, applicants: ${stat.applicants}, rate: "${stat.rate}" },\n`;
            }
        }
        output += `    },\n`;

        output += `  },\n`;
    }
    output += `];\n`;

    fs.writeFileSync(outFilePath, output);
    console.log(`Generated data for ${universities.size} universities.`);
}

processLineByLine();
