const effects = [
  {
    name: 'Normal',
    matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    overlayColor: 'transparent'
  },
  {
    // Tông màu phim nhựa cổ điển (Hơi vàng, ám xanh lá nhẹ ở vùng tối)
    // Phù hợp: Chụp phố xá, cafe, tạo cảm giác hoài niệm (như phim HongKong)
    name: 'Vintage 1990', 
    matrix: [
      0.9, 0.5, 0.1, 0, 0, 
      0.3, 0.8, 0.1, 0, 0, 
      0.2, 0.3, 0.6, 0, 0, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 220, 180, 0.15)' // Lớp phủ màu vàng kem nhẹ
  },
  {
    // Tông màu lạnh, xanh dương đậm (Blockbuster/Action)
    // Phù hợp: Chụp kiến trúc hiện đại, bầu trời, cảnh đêm, tạo vẻ ngầu/lạnh lùng
    name: 'Cool Cinema',
    matrix: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0.1, 0.1, 1.3, 0, -0.1,
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(0, 150, 255, 0.15)' // Lớp phủ xanh dương lạnh
  },
  {
    // Tông màu ấm rực rỡ (Golden Hour)
    // Phù hợp: Chụp biển, chụp lúc hoàng hôn, chụp dã ngoại
    name: 'Sunny Day',
    matrix: [
      1.2, 0.1, 0, 0, 0,   // Đẩy mạnh đỏ
      0.1, 1.1, 0, 0, 0,   // Đẩy nhẹ xanh lá
      0, 0.1, 0.8, 0, 0,   // Giảm xanh dương (để tạo sắc vàng)
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 165, 0, 0.15)' // Phủ màu cam
  },
  {
    // Hiệu ứng Cyberpunk (Ám tím/hồng neon)
    // Phù hợp: Chụp đèn đường ban đêm, bar, pub
    name: 'Cyberpunk',
    matrix: [
      1.2, 0, 0.2, 0, 0,  // Tăng đỏ kết hợp xanh -> tím
      0, 0.8, 0.2, 0, 0,  // Giảm xanh lá
      0.2, 0, 1.5, 0, 0,  // Tăng mạnh xanh dương
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(180, 0, 255, 0.15)' // Phủ màu tím neon
  },
  {
    name: 'Technicolor', // Màu phim điện ảnh cũ (như phim Tom & Jerry cũ), rực rỡ
    matrix: [
      1.912, -0.532, -0.288, 0, 0,
      -0.291, 2.00, -0.2, 0, 0,
      -0.1, -0.2, 1.7, 0, 0,
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(150, 150, 150, 0.8)'
  },
  
];
export default effects;