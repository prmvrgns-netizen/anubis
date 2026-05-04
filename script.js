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

// [관리자 설정] 레나만 아는 마스터 암호 & 길드 인증코드
const MASTER_PW = "rlaclWla101"; // 모든 게시물을 삭제할 수 있는 마스터 코드
const GUILD_CODE = "2026050411";  // 아카이브에 사진을 올릴 때 필요한 길드원 인증 코드

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

// --- [아카이브: 사진 서버 업로드 및 저장] ---
window.addArchive = async function() {
    // 1. 입력창에서 값 가져오기
    const name = document.getElementById('arc-name').value;
    const file = document.getElementById('arc-file').files[0];
    const content = document.getElementById('arc-content').value;

    // 2. 비어있는 칸이 있는지 확인
    if (!name || !file || !content) return alert("모든 내용을 입력해 주세요.");

    try {
        // 3. Storage(창고)에 사진 파일 먼저 업로드 (시간을 붙여서 이름 중복 방지)
        const storageRef = ref(storage, 'archive/' + Date.now() + "_" + file.name);
        const snapshot = await uploadBytes(storageRef, file);
        
        // 4. 업로드된 사진의 진짜 인터넷 주소(URL) 가져오기
        const downloadURL = await getDownloadURL(snapshot.ref);

        // 5. Firestore(데이터베이스)에 사진 주소와 내용을 기록
        await addDoc(collection(db, "archive"), {
            name: name,
            img: downloadURL, // 파일 대신 '주소'를 저장하는 게 핵심!
            content: content,
            date: Date.now()
        });

        alert("추억이 저장되었습니다!");
        location.reload(); // 새로고침해서 올린 사진 바로 확인하기
    } catch (e) {
        console.error(e);
        alert("업로드 실패!");
    }
};


window.deleteArchive = async function(id) {
    if(!confirm("이 추억을 삭제하시겠습니까?")) return;
    
    try {
        // 1. 파이어베이스(Firestore) 서버에서 해당 ID의 문서를 삭제
        await deleteDoc(doc(db, "archive", id));
        
        alert("삭제되었습니다.");
        
        // 2. 모달창 닫고 목록 새로고침
        window.closeModal();
        window.loadArchive();
    } catch (e) {
        console.error("삭제 실패:", e);
        alert("삭제 중 오류가 발생했습니다.");
    }
};


window.loadArchive = async function() {
    const grid = document.getElementById('archive-grid');
    if (!grid) return;
    
    try {
        // 서버에서만 가져오기 (localStorage는 이제 안 써!)
        const q = query(collection(db, "archive"), orderBy("date", "desc"));
        const snap = await getDocs(q);
        
        let html = "";
        snap.forEach((d) => {
            const item = d.data();
            html += `
                <div class="archive-item" onclick="window.openPhotoModal('${d.id}', '${item.img}', '${item.name}', '${item.content}')">
                    <img src="${item.img}" style="width:100%; aspect-ratio:1/1; object-fit:cover; border:1px solid #222;">
                </div>
            `;
        });
        
        // 데이터가 없으면 '비어있음'만 띄우기
        grid.innerHTML = html || "<div style='color:#444; text-align:center;'>아직 기록된 추억이 없어요.</div>";
    } catch (e) {
        console.error("데이터 불러오기 실패:", e);
    }
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
window.openPhotoModal = function(id, src, name, content, pw) {
    const modal = document.getElementById('photo-modal');
    if (!modal) return;
    
    const modalImg = document.getElementById('modal-img');
    if (modalImg) modalImg.src = src;
    
    const caption = document.getElementById('modal-caption');
    if (caption) {
        caption.innerHTML = `
            <!-- 닉네임과 삭제 버튼을 한 줄에 배치 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="color: #D4C56E; font-weight: bold; font-size: 1.1rem;">${name}</div>
                <button onclick="window.deleteArchive('${id}', '${pw}')" style="background: none; border: 1px solid #444; color: #666; padding: 5px 10px; cursor: pointer; font-size: 0.7rem; border-radius: 3px;">삭제하기</button>
            </div>
            
            <!-- 내용 부분 -->
            <div style="font-size: 0.9rem; color: #ccc; margin-bottom: 20px; line-height: 1.5; white-space: pre-wrap;">${content}</div>
        `;
    }
    
    modal.style.display = "flex"; 
};
