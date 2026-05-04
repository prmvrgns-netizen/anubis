import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjCg5p8Xd-Bj5FvxXaDcf05jDPUopL8CU",
  authDomain: "anubis-90172.firebaseapp.com",
  projectId: "anubis-90172",
  storageBucket: "anubis-90172.firebasestorage.app",
  messagingSenderId: "469616855680",
  appId: "1:469616855680:web:379c89620b47e37c537465",
  measurementId: "G-80T6VXVXJ7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- [1. 가입 신청 및 페이지 제어] ---
window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(p => { 
        p.classList.remove('active'); 
        p.style.display = 'none'; 
    });
    const target = document.getElementById(pageId);
    if (target) { 
        target.classList.add('active'); 
        target.style.display = 'flex'; 
    }
    if (pageId === 'archive') window.loadArchive();
    if (pageId === 'guestbook') window.loadGuestbook();
    window.scrollTo(0, 0);
};

// 가입 신청 버튼 클릭 시 실행
window.handleJoinClick = function() {
    window.showPage('join');
    const popup = document.getElementById('welcome-popup');
    if (popup) popup.style.display = 'flex';
};

window.toggleMenu = function() {
    const menu = document.getElementById('menu-overlay');
    const trigger = document.getElementById('menu-trigger');
    if(trigger) trigger.classList.toggle('open');
    if(menu) menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
};

window.navTo = function(pageId) { 
    window.toggleMenu(); 
    window.showPage(pageId); 
};

window.closePopup = function(id) {
    const target = document.getElementById(id);
    if (target) target.style.display = 'none';
};

// 가입 조건 아코디언
window.toggleRules = function() {
    const content = document.getElementById('rules-content');
    if (content) {
        content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    }
};

// --- [2. 아카이브 (사진) 기능] ---
window.openUploadModal = function() { 
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'flex'; 
};

window.closeUploadModal = function() { 
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'none'; 
};

window.addArchive = function() {
    const name = document.getElementById('arc-name').value;
    const file = document.getElementById('arc-file').files[0];
    const content = document.getElementById('arc-content').value;

    if (!name || !file || !content) return alert("빈칸을 입력해 주세요.");

    const reader = new FileReader();
    reader.onload = function(e) {
        const entry = { id: Date.now(), name, img: e.target.result, content };
        let archive = JSON.parse(localStorage.getItem('anubis_archive')) || [];
        archive.unshift(entry);
        localStorage.setItem('anubis_archive', JSON.stringify(archive));
        window.closeUploadModal();
        window.loadArchive();
    };
    reader.readAsDataURL(file);
};

window.deleteArchive = function(id) {
    if(!confirm("이 추억을 삭제하시겠습니까?")) return;
    let archive = JSON.parse(localStorage.getItem('anubis_archive')) || [];
    archive = archive.filter(item => String(item.id) !== String(id));
    localStorage.setItem('anubis_archive', JSON.stringify(archive));
    window.closeModal();
    window.loadArchive();
};

window.loadArchive = function() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    const archive = JSON.parse(localStorage.getItem('anubis_archive')) || [];
    grid.innerHTML = archive.map(item => `
        <div class="archive-item" onclick="window.openPhotoModal('${item.id}', '${item.img}', '${item.name}', '${item.content}')">
            <img src="${item.img}" style="width:100%; aspect-ratio:1/1; object-fit:cover; border:1px solid #222;">
        </div>
    `).join('');
};

window.openPhotoModal = function(id, src, name, content) {
    const modal = document.getElementById('photo-modal');
    if (!modal) return;
    document.getElementById('modal-img').src = src;
    document.getElementById('modal-caption').innerHTML = `
        <div style="margin-bottom:10px;"><strong>${name}</strong></div>
        <div style="font-size:0.9rem; color:#ccc; margin-bottom:20px;">${content}</div>
        <button onclick="window.deleteArchive('${id}')" style="background:none; border:1px solid #444; color:#666; padding:5px 10px; cursor:pointer; font-size:0.7rem;">삭제하기</button>
    `;
    modal.style.display = "flex"; 
};

window.closeModal = function() { 
    const modal = document.getElementById('photo-modal');
    if (modal) modal.style.display = "none"; 
};

// --- [3. 방명록 기능] ---
window.openGbModal = function() { 
    document.getElementById('gb-modal').style.display = 'flex'; 
};

window.closeGbModal = function() { 
    document.getElementById('gb-modal').style.display = 'none'; 
};

window.addGuestbook = async function() {
    const name = document.getElementById('gb-name').value;
    const pw = document.getElementById('gb-pw').value;
    const content = document.getElementById('gb-content').value;
    if (!name || !pw || !content) return alert("내용을 채워 주세요.");

    try {
        await addDoc(collection(db, "guestbook"), { name, pw, content, date: new Date().toLocaleString('ko-KR') });
        window.closeGbModal();
        window.loadGuestbook();
    } catch(e) { alert("저장 실패!"); }
};

window.deleteGuestbook = async function(docId, correctPw) {
    const inputPw = prompt("비밀번호를 입력하세요.");
    if (inputPw === correctPw) {
        await deleteDoc(doc(db, "guestbook", docId));
        alert("삭제 완료!");
        window.loadGuestbook();
    } else if (inputPw !== null) {
        alert("비밀번호가 틀렸습니다.");
    }
};

window.loadGuestbook = async function() {
    const list = document.getElementById('guestbook-list');
    if (!list) return;
    try {
        const q = query(collection(db, "guestbook"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        let html = "";
        snap.forEach((d) => {
            const p = d.data();
            html += `<div style="background:#111; border:1px solid #222; padding:20px; margin-bottom:10px; position:relative;">
                        <div style="color:#D4C56E; font-weight:bold; margin-bottom:10px;">${p.name}</div>
                        <div style="color:#ddd; font-size:0.9rem; white-space:pre-wrap;">${p.content}</div>
                        <div style="display:flex; justify-content:space-between; margin-top:12px;">
                            <span style="color:#333; font-size:0.7rem;">${p.date}</span>
                            <span onclick="window.deleteGuestbook('${d.id}', '${p.pw}')" style="color:#555; font-size:0.7rem; cursor:pointer;">[삭제]</span>
                        </div>
                    </div>`;
        });
        list.innerHTML = html || "<div style='color:#444; text-align:center;'>흔적을 남겨 보세요!</div>";
    } catch(e) { console.error(e); }
};

// 초기 실행
window.addEventListener('DOMContentLoaded', () => { 
    window.loadArchive(); 
    window.loadGuestbook(); 
});