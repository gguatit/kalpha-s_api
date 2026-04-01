// 범용 API 호출 및 결과 출력 (텍스트 또는 JSON)
async function apiCall(method, url, resultId, isText = false, body = null) {
  const el = document.getElementById(resultId);
  el.style.display = 'block';
  el.textContent = '데이터를 불러오는 중입니다...';
  
  try {
    const options = { method };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    
    if (!res.ok && res.status !== 404) {
      throw new Error('서버 응답 오류 (상태: ' + res.status + ')');
    }
    
    let textData = await res.text();
    if (!isText && textData) {
      try {
        const jsonData = JSON.parse(textData);
        textData = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        // Not a JSON
      }
    }
    
    el.textContent = textData || '결과 없음';
  } catch (err) {
    el.textContent = '요청 실패: ' + err.message;
  }
}

// 개별 테스트 실행 함수 (전역 연결)
window.testIpFull = () => apiCall('GET', '/ip', 'ipFullResult');
window.testIpSimple = () => apiCall('GET', '/ip/simple', 'ipSimpleResult', true);

window.testEncode = () => {
  const val = document.getElementById('encodeInput').value;
  if (!val) return alert('검색어를 먼저 입력해주세요.');
  apiCall('GET', '/encode?data=' + encodeURIComponent(val), 'encodeResult');
};

window.testDecode = () => {
  const val = document.getElementById('decodeInput').value;
  if (!val) return alert('검색어를 먼저 입력해주세요.');
  apiCall('GET', '/decode?data=' + encodeURIComponent(val), 'decodeResult');
};

window.testQR = async () => {
  const val = document.getElementById('qrInput').value;
  if (!val) return alert('검색어를 먼저 입력해주세요.');
  const el = document.getElementById('qrResult');
  el.style.display = 'block';
  el.textContent = '이미지 생성 중...';
  
  try {
    const res = await fetch('/qr?data=' + encodeURIComponent(val));
    if (!res.ok) throw new Error('QR코드 생성 실패');
    
    const svgCode = await res.text();
    // HTML 삽입
    el.innerHTML = svgCode;
  } catch (err) {
    el.textContent = '요청 실패: ' + err.message;
  }
};

window.testStore = async () => {
  const val = document.getElementById('storeInput').value;
  if (!val) return alert('암호화할 내용을 입력해주세요.');
  
  const el = document.getElementById('storeResult');
  el.style.display = 'block';
  el.textContent = '서버에 저장 중...';
  
  try {
    const res = await fetch('/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: val })
    });
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    
    // 자동 입력 구성
    if (data.id) {
      document.getElementById('readInput').value = data.id;
    }
  } catch (err) {
    el.textContent = '요청 실패: ' + err.message;
  }
};

window.testRead = () => {
  const val = document.getElementById('readInput').value;
  if (!val) return alert('조회할 ID를 입력해주세요.');
  apiCall('GET', '/read/' + encodeURIComponent(val), 'readResult', false);
};

window.testSecurity = () => apiCall('GET', '/security/headers', 'securityResult');
window.testEdgeForge = () => apiCall('GET', '/edgeforge', 'edgeforgeResult');