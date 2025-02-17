mapboxgl.accessToken = 'pk.eyJ1IjoieXV5dW4wNTMxIiwiYSI6ImNtNjY5bnA1azA2NnIyanNhajQwYTlqaHUifQ.66Ak3Cic4Y15i-ShrA5sPg';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/yuyun0531/cm76drcfq008t01r363hh7l1c/draft',
    center: [-3.435973, 55.378051], // 英国中心点
    zoom: 5
});

map.on('load', function () {
    console.log("Map has loaded!"); // 确认地图加载成功

    // 正确添加数据源
    map.addSource('uk_earthquake', {
        type: 'vector',
        url: 'mapbox://yuyun0531.cm76cldj9174t1osiijdf1i49-9qin0'
    });

    // 添加热力图图层
    map.addLayer({
        id: 'uk_earthquake-heatmap',
        type: 'heatmap',
        source: 'uk_earthquake',
        'source-layer': 'uk_earthquake', // 热力图图层名称
        paint: {
            'heatmap-weight': {
                property: ' ML', // 假设震级字段为 ML
                type: 'exponential',
                stops: [
                    [0, 0],   // 震级 0，权重为 0
                    [1, 1]   // 震级 1，权重为 1
                ]
            },
            'heatmap-intensity': 1,
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'hsla(240, 100%, 50%)',       // 0-0.1，蓝色
                0.2, 'hsl(193, 94%, 57%)',  // 0.1-0.2，浅蓝色
                0.4, 'hsl(167, 100%, 75%)',   // 0.2-0.3，更浅的蓝色
                0.6, 'hsl(56, 100%, 60%)',     // 0.3-0.4，橙色
                0.8, 'hsl(24, 100%, 55%)',     // 0.4-0.5，深橙色
                1, 'hsl(0, 83%, 52%)'       // 0.5-0.9，红色
            ]
        }
    });

    // 添加点图层
   map.addLayer({
    id: 'uk_earthquake-points',
    type: 'circle',
    source: 'uk_earthquake',
    'source-layer': 'uk_earthquake', // 确保与 Mapbox Studio 数据层一致
    paint: {
        'circle-radius': 2.5,  // ✅ 固定所有点的大小
        'circle-color': 'hsl(193, 78%, 41%)',  // ✅ 统一颜色
        'circle-opacity': 0.7,
        'circle-stroke-width': 0.4,
        'circle-stroke-color': 'hsl(193, 81%, 20%)' // ✅ 轮廓颜色
       
    }
});


    console.log('Layers added:', map.getLayer('uk_earthquake-heatmap'), map.getLayer('uk_earthquake-points')); // 确认图层已添加

map.on('click', 'uk_earthquake-points', function (e) {
   console.log("Feature properties:", e.features[0].properties);
    if (!e.features || e.features.length === 0) {
        console.error("No features found on click!");
        return;
    }

    const feature = e.features[0];
    const properties = feature.properties;

    // **调试所有字段**
   
    // **调试：打印所有字段和值**
    console.log("Feature properties:", properties);
    console.log("All property keys:", Object.keys(properties));

    // **提取字段（确保字段名正确）**
    const date = properties['yyyy-mm-dd'] || 'Unknown';
    const time = properties[' hh:mm:ss.ss'] || 'Unknown';
    const depth = properties[' depth'] || 'Unknown';
    const magnitude = properties[' ML'] || 'Unknown';
    const locality = properties[' locality'] || 'Unknown';

    const popupContent = `
        <h3>🌍 Earthquake Information</h3>
        <p>📅 <strong>Date:</strong> ${date}</p>
        <p>⏰ <strong>Time:</strong> ${time}</p>
        <p>🌊 <strong>Depth:</strong> ${depth} km</p>
        <p>🔥 <strong>Magnitude (ML):</strong> ${magnitude}</p>
        <p>📍 <strong>Locality:</strong> ${locality}</p>
    `;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
});




    // 鼠标悬停时改变光标样式
    map.on('mouseenter', 'uk_earthquake-points', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'uk_earthquake-points', function () {
        map.getCanvas().style.cursor = '';
    });
});


// 添加搜索框
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false, // 不显示默认标记
    placeholder: 'Search for earthquake cities', // 搜索框占位符
    proximity: {
        longitude: -122.4194,
        latitude: 37.7749
    } // 设置搜索的初始中心点
});

// 将搜索框添加到地图中
map.addControl(geocoder, 'top-left');




const tooltip = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});



map.on('mousemove', 'uk_earthquake-points', function (e) {
    if (e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;

        // **自动去除字段名前后空格**
        const cleanedProperties = {};
        Object.keys(properties).forEach(key => {
            cleanedProperties[key.trim()] = properties[key];
        });

        // **正确获取 ML 和 locality**
        const magnitude = cleanedProperties["ML"] || cleanedProperties[" ML"] || "未知";
        const locality = cleanedProperties["locality"] || cleanedProperties[" locality"] || "未知";

        tooltip.setLngLat(e.lngLat)
            .setHTML(`<strong>${locality}</strong><br>🔹 Magnitude (ML): ${magnitude}`)
            .addTo(map);
    }
});

map.on('mouseleave', 'uk_earthquake-points', function () {
    tooltip.remove();
});



document.getElementById('timeSlider').addEventListener('input', function (e) {
    const daysAgo = parseInt(e.target.value);
    document.getElementById('timeLabel').innerText = daysAgo; // 更新 UI

    const now = new Date();
    const pastDate = new Date();
    pastDate.setDate(now.getDate() - daysAgo);
    const pastDateString = pastDate.toISOString().split('T')[0]; // 确保格式匹配 "YYYY-MM-DD"

    // **如果滑块最大值（30天），恢复所有数据**
    if (daysAgo === 30) {
        map.setFilter('uk_earthquake-points', null); // 移除所有筛选条件，恢复默认
    } else {
        map.setFilter('uk_earthquake-points', [
            'all',
            ['>=', ['get', 'yyyy-mm-dd'], pastDateString]
        ]);
    }
});


// Load Chart.js (Make sure you include Chart.js in your HTML)

// ✅ 1. 先添加 **放大缩小控件**，放在左下角
map.addControl(new mapboxgl.NavigationControl(), "bottom-left");

// ✅ 2. 再添加 **定位控件**，放在左下角（但往上移动一点）
const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
});
map.addControl(geolocate, "bottom-left");