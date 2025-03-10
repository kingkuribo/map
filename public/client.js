getUserLocation();
let map;
let currentMarker;
let infoWindow;
let marker;

const defaultLocation = {
  lat: 35.6895,
  lng: 139.6917,
};

async function initMap(position) {
  if (position) {
    console.log("位置情報表示");
    const lat = parseFloat(position.coords.latitude);
    const lng = parseFloat(position.coords.longitude);

    userlocation = {
      lat: lat,
      lng: lng,
    };
  } else if (!position) {
    console.log("デフォルト座標");
    userlocation = defaultLocation;
  }
  const mapOptions = {
    center: userlocation,
    zoom: 14,
  };
  const mapDiv = document.getElementById("map");
  map = new google.maps.Map(mapDiv, mapOptions);

  // **データベースの座標を取得し、マーカーを表示**
  await loadMarkersFromDB();

  infoWindow = new google.maps.InfoWindow();

  // クリックイベントの追加
  map.addListener("click", async (event) => {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    // 住所を取得
    const address = await getAddressFromCoords(lat, lng);

    // ピンを作成
    // ピンを作成
    currentMarker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
    });

    console.log("クリックされた座標:", clickedLocation);
    // 情報ウィンドウを表示
    infoWindow.setContent(`
    <div>
        <p><strong>住所:</strong> ${address}</p>
        <button id="cancelBtn">キャンセル</button>
        <button id="saveBtn">登録</button>
    </div>
`);
    infoWindow.open(map, currentMarker);

    // ボタンイベントを追加（ウィンドウが開いた後にDOM要素を取得する）
    setTimeout(() => {
      document.getElementById("cancelBtn").addEventListener("click", () => {
        currentMarker.setMap(null);
        infoWindow.close();
      });

      document.getElementById("saveBtn").addEventListener("click", () => {
        saveLocationToDB(clickedLocation);
        infoWindow.close();
      });
    }, 100);
  });
}

//  **データベースに保存されている座標を取得し、マーカーを追加**
async function loadMarkersFromDB() {
  try {
    const response = await fetch("/api/get-locations");
    const locations = await response.json();

    console.log("取得した座標データ:", locations);

    locations.forEach((loc) => {
      addMarkers({ lat: loc.latitude, lng: loc.longitude });
    });
  } catch (error) {
    console.error("マーカーの取得に失敗:", error);
  }
}

//  **クリックした座標をNode.jsサーバーに送信**
async function saveLocationToDB(location) {
  try {
    const response = await fetch("/api/save-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });

    const data = await response.json();
    console.log("サーバーからの応答:", data);
  } catch (error) {
    console.error("データの送信に失敗:", error);
  }
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("位置情報を取得しました:", position);
        initMap(position);
      },
      (error) => {
        console.error("位置情報の取得に失敗しました:", error);
        initMap(); // 失敗した場合はデフォルトの位置を使用
      }
    );
  } else {
    console.error("このブラウザは位置情報取得をサポートしていません。");
    initMap(); // サポートしていない場合はデフォルトの位置を使用
  }
}

function addMarkers(location) {
  new google.maps.Marker({
    position: location,
    map: map,
  });
}

//  **修正点: ここに `getAddressFromCoords` を定義**
async function getAddressFromCoords(lat, lng) {
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        resolve("住所が取得できませんでした");
      }
    });
  });
}
