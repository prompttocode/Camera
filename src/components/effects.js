const effects = [
  // ==================================================
  // NHÓM 1: BASIC & VIVID (Tự nhiên & Rực rỡ)
  // ==================================================
  {
    name: 'Normal',
    matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    overlayColor: 'transparent'
  },
  {
    // Tăng bão hòa màu, làm ảnh tươi hơn, phù hợp chụp đồ ăn/phong cảnh
    name: 'Vivid Boost',
    matrix: [
      1.3, -0.15, -0.15, 0, 0,
      -0.15, 1.3, -0.15, 0, 0,
      -0.15, -0.15, 1.3, 0, 0,
      0, 0, 0, 1, 0
    ],
    overlayColor: 'transparent'
  },

  // ==================================================
  // NHÓM 2: VINTAGE & RETRO (Hoài cổ)
  // ==================================================
  {
    // Màu nâu nhạt, cảm giác cũ kỹ thập niên 90
    name: 'Vintage 1990', 
    matrix: [
      1.1, 0.2, 0.1, 0, 0.05, 
      0.1, 1.0, 0.1, 0, 0.02, 
      0.1, 0.1, 0.8, 0, 0, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 220, 180, 0.15)' 
  },
  {
    // Màu Polaroid: Hơi ám xanh lơ (Cyan) ở vùng tối, da dẻ hồng hào
    name: 'Polaroid',
    matrix: [
      1.2, -0.1, 0, 0, 0,
      -0.05, 1.1, -0.05, 0, 0,
      -0.1, 0, 1.1, 0, 0.05, // Tăng bias xanh dương nhẹ
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(200, 255, 255, 0.1)'
  },
  {
    // Màu Sepia chuẩn: Nâu đỏ đậm
    name: 'Classic Sepia',
    matrix: [
      0.39, 0.77, 0.19, 0, 0, 
      0.35, 0.69, 0.17, 0, 0, 
      0.27, 0.53, 0.13, 0, 0, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(150, 80, 20, 0.3)'
  },

  // ==================================================
  // NHÓM 3: CINEMATIC (Màu phim điện ảnh)
  // ==================================================
  {
    // Màu Teal & Orange: Đặc trưng phim Hollywood (Da cam, nền xanh)
    name: 'Teal & Orange',
    matrix: [
      1.2, -0.2, 0, 0, 0.05, 
      -0.1, 1.2, -0.1, 0, -0.05, 
      -0.2, -0.1, 1.4, 0, -0.05, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(0, 180, 180, 0.15)'
  },
  {
    // Cool Cinema: Tông lạnh, ám xanh dương, phim hành động
    name: 'Cool Cinema',
    matrix: [
      1.0, 0, 0, 0, -0.05, 
      0, 1.0, 0, 0, -0.05, 
      0.1, 0.1, 1.3, 0, 0, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(0, 150, 255, 0.15)' 
  },
  {
    // Cyberpunk: Ám tím/hồng Neon (Chụp đêm cực đẹp)
    name: 'Cyberpunk',
    matrix: [
      1.3, -0.1, 0.2, 0, 0,  
      -0.1, 0.8, 0.1, 0, 0,  
      0.2, -0.1, 1.4, 0, 0,  
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(180, 0, 255, 0.15)' 
  },
  {
    // Bleach Bypass: Màu phim chiến tranh (Tương phản cao, ít màu)
    name: 'Bleach Bypass',
    matrix: [
      1.5, -0.5, 0, 0, 0,
      -0.2, 1.2, 0, 0, 0,
      -0.2, -0.2, 1.2, 0, 0,
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(100, 100, 100, 0.2)'
  },

  // ==================================================
  // NHÓM 4: PASTEL & SOFT (Hàn Quốc/Mơ mộng)
  // ==================================================
  {
    // Sweet Pink: Màu hồng phấn nhẹ, làm trắng da
    name: 'Sweet Pastel',
    matrix: [
      1.1, 0.05, 0.05, 0, 0.05, 
      0, 1.05, 0, 0, 0.05, 
      0, 0.05, 1.1, 0, 0.05, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 200, 220, 0.1)'
  },
  {
    // Faded Light: Màu nhạt, mờ sương
    name: 'Faded Light',
    matrix: [
      0.9, 0.05, 0.05, 0, 0.05, 
      0.05, 0.9, 0.05, 0, 0.05, 
      0.05, 0.05, 0.9, 0, 0.05, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 255, 255, 0.15)'
  },
  {
    // Sunny Day: Nắng vàng ấm áp
    name: 'Sunny Day',
    matrix: [
      1.2, 0.1, 0, 0, 0.02,   
      0.05, 1.1, 0, 0, 0.02,   
      0, 0.1, 0.8, 0, 0,   
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(255, 165, 0, 0.15)' 
  },

  // ==================================================
  // NHÓM 5: BLACK & WHITE (Đen trắng)
  // ==================================================
  {
    // Grayscale: Đen trắng tiêu chuẩn
    name: 'Grayscale',
    matrix: [
      0.3, 0.59, 0.11, 0, 0, 
      0.3, 0.59, 0.11, 0, 0, 
      0.3, 0.59, 0.11, 0, 0, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(0, 0, 0, 0.1)'
  },
  {
    // Noir: Đen trắng tương phản mạnh, tạo khối sâu
    name: 'Noir Dramatic',
    matrix: [
      1.5, 0, 0, 0, -0.2, 
      0, 1.5, 0, 0, -0.2, 
      0, 0, 1.5, 0, -0.2, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(0, 0, 0, 0.4)'
  },
  {
    // Silverscreen: Đen trắng kiểu phim nhựa cũ (hơi bạc)
    name: 'Silverscreen',
    matrix: [
      0.4, 0.6, 0.1, 0, 0.1, 
      0.4, 0.6, 0.1, 0, 0.1, 
      0.4, 0.6, 0.1, 0, 0.1, 
      0, 0, 0, 1, 0
    ],
    overlayColor: 'rgba(200, 200, 200, 0.1)'
  }
];

export default effects;