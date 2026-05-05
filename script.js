import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
const storage = getStorage(app);

// [관리자 설정] master pw and axc
const MASTER_PW = "rlaclWla101";
const GUILD_CODE = "2026050411";

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

window.toggleRules = function() {
    const content = document.getElementById('rules-content');
    if (content) {
        content.style.display = (content.style.display === 'block') ? 'none' : 'block';
    }
};

// archive
window.openUploadModal = function() { 
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'flex'; 
};

window.closeUploadModal = function() { 
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'none'; 
};

window.addArchive = async function() {
    const name = document.getElementById('arc-name').value;
    const auth = document.getElementById('arc-auth').value;
    const pw = document.getElementById('arc-pw').value;
    const file = document.getElementById('arc-file').files[0];
    const content = document.getElementById('arc-content').value;

    if (!name || !auth || !file || !pw || !content) return alert("빈칸을 채워 주세요.");
    if (auth !== GUILD_CODE) {
      return alert("인증 코드가 일치하지 않습니다.");
    }
    try {
        const storageRef = ref(storage, 'archive/' + Date.now() + "_" + file.name);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        // Firestore
        await addDoc(collection(db, "archive"), { name, pw, img: downloadURL, content, date: Date.now() });
        alert("추억이 저장되었습니다!");
        location.reload();
    } catch (e) { alert("업로드 실패"); }
};

window.deleteArchive = async function(id, correctPw) {
    const inputPw = prompt("암호를 입력하세요.");
    if (inputPw === null) return;
    if (String(inputPw) === String(correctPw) || inputPw === MASTER_PW) {
        if(!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(doc(db, "archive", id));
            alert("삭제되었습니다.");
            window.closeModal();
            window.loadArchive();
        } catch (e) { alert("삭제 실패"); }
    } else {
        alert("암호가 일치하지 않습니다.");
    }
};

window.loadArchive = async function() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    try {
        const q = query(collection(db, "archive"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        let html = "";
        snap.forEach((d) => {
            const item = d.data();
            html += `
                <div class="archive-item" onclick="window.openPhotoModal('${d.id}', '${item.img}', '${item.name}', '${item.content}', '${item.pw}')">
                    <img src="${item.img}" style="width:100%; aspect-ratio:1/1; object-fit:cover; border:1px solid #222;">
                </div>`;
        });
        
        grid.innerHTML = html || "<div style='color:#444; text-align:center;'>추억 준비 중</div>";
    } catch (e) { console.error(e); }
};

window.openPhotoModal = function(id, src, name, content, pw) {
    const modal = document.getElementById('photo-modal');
    if (!modal) return;
    document.getElementById('modal-img').src = src;
    document.getElementById('modal-caption').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="color: #d4c56e; font-weight: bold; font-size: 1.1rem; ">${name}</div>
        <button onclick="window.deleteArchive('${id}', '${pw}')" style="background: none; border: 1px solid #444; color: #666; padding: 5px 10px; cursor: pointer; font-size: 0.7rem;">삭제하기</button>
        </div>
        <div style="font-size:0.9rem; color:#ccc; margin-bottom:20px; line-height: 1.5; white-space: pre-wrap; text-align:left;">${content}</div>
        `;
    modal.style.display = "flex"; 
};

window.closeModal = function() { 
    const modal = document.getElementById('photo-modal');
    if (modal) modal.style.display = "none";
};

// guestbook
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
    if (!name || !pw || !content) return alert("빈칸을 채워 주세요.");
    try {
        await addDoc(collection(db, "guestbook"), { name, pw, content, date: new Date().toLocaleString('ko-KR') });
        window.closeGbModal();
        window.loadGuestbook();
    } catch(e) { alert("업로드 실패"); }
};

window.deleteGuestbook = async function(docId, correctPw) {
    const inputPw = prompt("암호를 입력하세요.");
    if (inputPw == null) return;
    if (String(inputPw) === String(correctPw) || inputPw === MASTER_PW) {
        try {
          await deleteDoc(doc(db, "guestbook", docId));
        alert("삭제되었습니다.");
        window.loadGuestbook();
    } catch(e) { alert("삭제 실패"); }
}  else {
        alert("암호가 일치하지 않습니다.");
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
            html += `<div style="background:#111; border:1px solid #222; padding:20px; margin-bottom:10px; position:relative; text-align: left;">
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
