using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; }
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // 2. DTO chi tiết bác sĩ
    public class DoctorDetailDTO
    {
        public string DoctorID { get; set; }
        public string FullName { get; set; }
        public string Specialty { get; set; }
        public string Qualifications { get; set; }
        public int? YearsOfExperience { get; set; }
        public string LanguageSpoken { get; set; }
        public string Location { get; set; }

        // Thống kê đánh giá
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<ReviewDTO>? Reviews { get; set; }
    }

    // 3. DTO từng review lẻ
    public class ReviewDTO
    {
        public int ReviewID { get; set; }
        public string PatientName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime ReviewDate { get; set; }
    }

    // 4. DTO tìm kiếm (Input) - Đổi tên từ DoctorFilterDTO thành DoctorFilterInputDTO cho rõ nghĩa
    public class DoctorFilterInputDTO
    {
        public string? Specialty { get; set; }
        public string? Name { get; set; }
        public string? Location { get; set; }
        public string? Language { get; set; }

        // Pagination Params (Mặc định trang 1, 5 item/trang)
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 5;
    }
}