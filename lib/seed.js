// Sample editorial content; replace portfolio placeholders with the studio's own photographs.
const content = {
  studio: { name: 'Inkline Studio', address: '42 Nguyễn Huệ, Quận 1, TP.HCM', phone: '0901 222 333', hours: '' },
  styles: [
    { id:'fine-line', name:'Fine Line', description:'Đường nét mảnh, tinh tế và giàu cảm xúc.' },
    { id:'minimal', name:'Minimal', description:'Bố cục tối giản, dành khoảng trống cho ý nghĩa.' },
    { id:'blackwork', name:'Blackwork', description:'Mảng đen mạnh mẽ, tương phản và cá tính.' },
    { id:'japanese', name:'Japanese', description:'Bố cục lớn, nhiều lớp ý nghĩa và màu sắc sâu.' }
  ],
  artists: [
    { id:'artist-minh', name:'Minh Trần', specialty:'Fine Line / Minimal', years:6, visible:true, bio:'Minh yêu những đường nét thanh mảnh và hình ảnh gắn với ký ức cá nhân. Mỗi thiết kế bắt đầu từ một cuộc trò chuyện.', styleIds:['fine-line','minimal'] },
    { id:'artist-linh', name:'Linh Phạm', specialty:'Blackwork / Ornamental', years:8, visible:true, bio:'Linh tập trung vào cấu trúc, họa tiết và tương phản. Các tác phẩm được phát triển theo chuyển động tự nhiên của cơ thể.', styleIds:['blackwork','minimal'] },
    { id:'artist-kai', name:'Kai Nguyễn', specialty:'Japanese / Neo Traditional', years:10, visible:true, bio:'Kai theo đuổi những bố cục lớn, từ nửa cánh tay đến toàn lưng, kết hợp hình ảnh truyền thống với câu chuyện của người sở hữu.', styleIds:['japanese','blackwork'] }
  ],
  services: [
    { id:'consult', name:'Tư vấn ý tưởng', price:'Miễn phí', description:'Trao đổi concept, vị trí, kích thước và artist phù hợp.' },
    { id:'small', name:'Small Tattoo', price:'Từ 700.000đ', description:'Thiết kế nhỏ với đường nét và bố cục được cá nhân hóa.' },
    { id:'custom', name:'Custom Design', price:'Từ 2.500.000đ', description:'Thiết kế riêng theo câu chuyện, phong cách và vị trí xăm.' },
    { id:'cover', name:'Cover-up / Rework', price:'Báo giá riêng', description:'Trao đổi trực tiếp với artist để đánh giá và lên ý tưởng cho hình xăm cũ.' }
  ],
  portfolio: [
    { id:'p1', title:'Botanical wrist line', artistId:'artist-minh', styleId:'fine-line', placement:'Cổ tay' },
    { id:'p2', title:'Blackwork shoulder piece', artistId:'artist-linh', styleId:'blackwork', placement:'Vai' },
    { id:'p3', title:'Koi half sleeve', artistId:'artist-kai', styleId:'japanese', placement:'Cánh tay' },
    { id:'p4', title:'Tiny moon minimal', artistId:'artist-minh', styleId:'minimal', placement:'Sau gáy' },
    { id:'p5', title:'Ornamental chest', artistId:'artist-linh', styleId:'blackwork', placement:'Ngực' },
    { id:'p6', title:'Dragon back concept', artistId:'artist-kai', styleId:'japanese', placement:'Lưng' }
  ],
  blog: [
    { id:'b1', title:'Một ý tưởng, nhiều cách thể hiện', tag:'Cảm hứng', excerpt:'Bắt đầu từ câu chuyện của bạn, rồi cùng artist tìm ngôn ngữ hình ảnh phù hợp.', content:'Một hình ảnh có thể gợi lại một nơi chốn, một người hoặc một thời điểm. Bạn không cần có bản vẽ hoàn chỉnh để bắt đầu cuộc trò chuyện với artist.\n\nHãy ghi lại điều bạn muốn lưu giữ, những màu sắc yêu thích và vị trí dự kiến. Nếu có hình tham khảo, hãy cho artist biết bạn thích đường nét, bố cục hay cảm giác của hình đó.\n\nTại Inkline, buổi tư vấn là thời gian để hai bên hiểu nhau và phát triển một thiết kế riêng.' },
    { id:'b2', title:'Khám phá portfolio của artist', tag:'Studio guide', excerpt:'Tìm phong cách phù hợp qua đường nét, bố cục và cách artist kể chuyện.', content:'Mỗi artist có một ngôn ngữ riêng. Hãy dùng bộ lọc phong cách và artist trong thư viện để xem các tác phẩm liên quan.\n\nBạn có thể mở hồ sơ để đọc giới thiệu và xem portfolio của từng người. Nút đặt lịch trong hồ sơ sẽ tự chọn đúng artist đó.\n\nNếu còn phân vân, hãy đặt một buổi tư vấn và chia sẻ điều bạn đang tìm kiếm.' },
    { id:'b3', title:'Chuẩn bị ý tưởng cho buổi tư vấn', tag:'Ý tưởng', excerpt:'Một vài ghi chú nhỏ giúp buổi trao đổi đi đúng điều bạn mong muốn.', content:'Trước buổi hẹn, bạn có thể chuẩn bị ba điều: câu chuyện muốn thể hiện, vị trí dự kiến và kích thước mong muốn.\n\nHình tham khảo giúp diễn đạt ý tưởng. Hãy ghi rõ những điểm bạn thích để artist có thể phát triển một thiết kế mang dấu ấn của bạn.\n\nTrong form đặt lịch, bạn có thể tải ảnh hoặc gửi đường dẫn tham khảo. Studio sẽ xem yêu cầu và liên hệ xác nhận trước buổi hẹn.' }
  ]
};

// Full initial state used when the database is empty.
export default function initialState() {
  const d = structuredClone(content);
  d.studio = { ...d.studio, email: 'hello@inkline.vn', social: '', logo: '', heroTitle: 'Mỗi hình xăm, một câu chuyện.', heroText: 'Tìm phong cách của bạn. Gặp người nghệ sĩ phù hợp. Cùng tạo nên dấu ấn riêng.', about: 'Inkline là không gian dành cho những ý tưởng mang dấu ấn cá nhân. Chúng tôi lắng nghe câu chuyện của bạn, tư vấn thiết kế và đồng hành từ buổi hẹn đầu tiên.', policy: 'Studio phản hồi trong 24 giờ. Yêu cầu chờ xác nhận sẽ giữ khung giờ cho bạn. Vui lòng liên hệ studio nếu cần đổi hoặc hủy lịch.', openTime: '10:00', closeTime: '20:00', slotStep: 30, openDays: [0, 2, 3, 4, 5, 6] };
  d.artists.forEach(a => Object.assign(a, { workDays: [0, 1, 2, 3, 4, 5, 6], daysOff: [], image: '' }));
  d.services.forEach((s, i) => Object.assign(s, { duration: [30, 60, 120, 180][i], visible: true }));
  d.portfolio.forEach(p => Object.assign(p, { image: '', description: '', visible: true, gradient: 'linear-gradient(135deg, #241d1b, #875045)' }));
  d.blog.forEach(b => Object.assign(b, { visible: true }));
  d.bookings = [];
  return d;
}
