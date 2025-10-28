// Kakao Map initialization
kakao.maps.load(function() {
  // 트라움자원 좌표
  const lat = 37.680957;
  const lng = 126.548056;
  
  const mapContainer = document.getElementById('map');
  const mapOption = {
    center: new kakao.maps.LatLng(lat, lng),
    level: 3,
    draggable: true,
    scrollwheel: true,
    disableDoubleClickZoom: false
  };

  // 지도 생성
  const map = new kakao.maps.Map(mapContainer, mapOption);

  // 마커 생성
  const markerPosition = new kakao.maps.LatLng(lat, lng);
  const marker = new kakao.maps.Marker({
    position: markerPosition,
    map: map,
    title: '트라움자원'
  });

  // 인포윈도우 생성
  const infowindow = new kakao.maps.InfoWindow({
    content: `
      <div style="padding:10px;min-width:200px;line-height:1.5;">
        <h4 style="margin:0 0 5px 0;font-size:14px;">트라움자원 주식회사</h4>
        <p style="margin:0;font-size:12px;color:#666;">
          경기도 김포시 대곶면<br>
          대곶로423번길 140
        </p>
        <a href="https://map.kakao.com/link/to/트라움자원,${lat},${lng}" 
           target="_blank" 
           style="display:inline-block;margin-top:5px;color:#1a4f34;font-size:12px;">
          길찾기 →
        </a>
      </div>
    `,
    removable: true
  });

  // 마커 클릭 이벤트
  kakao.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map, marker);
  });

  // 지도 타입 컨트롤 추가
  const mapTypeControl = new kakao.maps.MapTypeControl();
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

  // 줌 컨트롤 추가
  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  // 지도 리사이즈 처리
  window.addEventListener('resize', function() {
    map.relayout();
  });

  // 모바일에서 터치 이벤트 개선
  if ('ontouchstart' in window) {
    mapContainer.addEventListener('touchstart', function() {
      map.setDraggable(true);
    });
  }

  // 지도 중심 재설정 함수
  window.recenterMap = function() {
    const moveLatLon = new kakao.maps.LatLng(lat, lng);
    map.setCenter(moveLatLon);
  };
});