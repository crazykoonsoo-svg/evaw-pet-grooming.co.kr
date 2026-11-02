// Derive news listing metadata from the published articles. Run before build-rss.mjs.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const site='https://evaw-pet-grooming.co.kr';
const read=p=>readFileSync(p,'utf8');
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const plain=s=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim();
const attr=(tag,key)=>(tag.match(new RegExp('\\b'+key+'=["\']([^"\']*)'))||[])[1]||'';
const meta=(s,key)=>(s.match(/<meta\b[^>]*>/g)||[]).find(t=>attr(t,'name')===key||attr(t,'property')===key)||'';
let board=read('news/index.html');
const existing=new Map([...board.matchAll(/<a class="nc-card"[\s\S]*?<\/a>/g)].map(m=>[attr(m[0],'href'),m[0]]));
const posts=[];
for(const d of readdirSync('news',{withFileTypes:true}).filter(d=>d.isDirectory())){
 let s;try{s=read(`news/${d.name}/index.html`)}catch{continue}
 if(attr(meta(s,'robots'),'content').includes('noindex'))continue;
 const url=attr((s.match(/<link\b[^>]*rel="canonical"[^>]*>/)||[])[0]||'','href');
 if(!url.startsWith(site+'/news/'))throw Error('Unexpected canonical: '+d.name);
 const title=plain((s.match(/<title[^>]*>([\s\S]*?)<\/title>/)||[])[1]||'');
 const description=attr(meta(s,'description'),'content');
 const image=attr(meta(s,'og:image'),'content').replace(site,'');
 const imageTag=(s.match(/<img\b[^>]*>/g)||[]).find(t=>attr(t,'src').replace(site,'')===image)||'';
 const path=url.slice(site.length);const date=(s.match(/<time[^>]*datetime="([0-9-]+)/)||[])[1]||(d.name.match(/^\d{4}-\d{2}-\d{2}/)||[])[0];
 if(!title||!date)throw Error('Missing title/date: '+path);
 const badge=plain((s.match(/<span class="art-badge">([\s\S]*?)<\/span>/)||[])[1]||'이바우펫 · 새소식');
 let card=existing.get(path);
 if(card){card=card.replace(/(<div class="nc-title">)[\s\S]*?(<\/div>)/,(_,a,b)=>a+esc(title)+b)}
 else{const alt=attr(imageTag,'alt')||title;const dims=['width','height'].map(k=>attr(imageTag,k)?` ${k}="${attr(imageTag,k)}"`:'').join('');card=`<a class="nc-card" href="${path}"><img class="nc-image" src="${image}" alt="${esc(alt)}" loading="lazy"${dims}/><div class="nc-content"><span class="nc-badge">${esc(badge)}</span><div class="nc-title">${esc(title)}</div><div class="nc-excerpt">${esc(description)}</div><div class="nc-footer"><span class="nc-date">${date.replaceAll('-','.')}</span><span class="nc-arrow">자세히 보기 →</span></div></div></a>`;}
 posts.push({url,path,title,date,card});
}
posts.sort((a,b)=>b.date.localeCompare(a.date)||a.path.localeCompare(b.path));
board=board.replace(/(<div class="news-grid" id="boardBody">)[\s\S]*?(<div class="pagination")/,(_,start,end)=>start+'\n'+posts.map(p=>p.card).join('\n')+'\n</div>\n'+end);
board=board.replace(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,(tag,raw)=>{
 const data=JSON.parse(raw);if(data['@type']!=='ItemList')return tag;
 data.itemListElement=posts.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.title,url:p.url}));
 data.numberOfItems=posts.length;return '<script type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';
});
writeFileSync('news/index.html',board);
let sitemap=read('sitemap.xml');
for(const p of posts){if(!sitemap.includes('<loc>'+p.url+'</loc>'))sitemap=sitemap.replace('</urlset>',`<url><loc>${p.url}</loc><lastmod>${p.date}</lastmod></url>\n</urlset>`)}
writeFileSync('sitemap.xml',sitemap);
console.log(`News cards and ItemList synchronized: ${posts.length}`);
