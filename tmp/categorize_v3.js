const fs = require('fs');
const players = JSON.parse(fs.readFileSync('server/data/players.json', 'utf-8'));

const getCategory = (p) => {
    const nat = (p.nationality || "").toLowerCase().trim();
    const isInd = nat === "india" || nat === "indian";
    const baseP = parseFloat(p.base_price || 0);
    const tier = (p.tier || "").toLowerCase().trim();
    const isS = (tier === 'marquee' || tier === 'international top' || tier === 'star' || baseP >= 2.0);
    
    if (isInd && isS) return { num: 1, name: 'STAR INDIA' };
    if (!isInd && isS) return { num: 2, name: 'STAR INT' };
    if (isInd) return { num: 3, name: 'CAPPED INDIAN' };
    return { num: 4, name: 'CAPPED INT' };
};

const processed = players.map(p => ({ ...p, cat: getCategory(p) }))
                        .sort((a,b) => (parseInt(a.id)||0) - (parseInt(b.id)||0));

const s1 = processed.filter(p => p.cat.num === 1).slice(0,30);
const s2 = processed.filter(p => p.cat.num === 2).slice(0,30);
const s3 = processed.filter(p => p.cat.num === 3).slice(0,150);
const s4 = processed.filter(p => p.cat.num === 4).slice(0,150);

console.log('--- STATS ---');
console.log('S1:', s1.length, s1[0]?.name, 'ID:', s1[0]?.id);
console.log('S2:', s2.length, s2[0]?.name, 'ID:', s2[0]?.id);
console.log('S3:', s3.length, s3[0]?.name, 'ID:', s3[0]?.id);
console.log('S4:', s4.length, s4[0]?.name, 'ID:', s4[0]?.id);

const queue = [...s1, ...s2, ...s3, ...s4];
console.log('--- TOP 5 QUEUE ---');
queue.slice(0,5).forEach((p, i) => console.log(i+1, p.name, 'ID:', p.id, 'SET:', p.cat.num));
