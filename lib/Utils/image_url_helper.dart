import '../Services/api_constants.dart';

/// Helper for constructing medical report image URLs
/// 
/// ALL images are now stored in MongoDB
/// imagePath contains the PatientPDF._id (24-character MongoDB ID)
class ImageUrlHelper {
  /// Constructs the correct URL for medical report images
  /// 
  /// All images stored in MongoDB:
  /// - Input: `507f1f77bcf86cd799439011` (PatientPDF._id)
  /// - Output: `http://server/api/scanner-enterprise/pdf-public/507f1f77bcf86cd799439011`
  static String getMedicalReportImageUrl(String imagePath) {
    if (imagePath.isEmpty) return '';
    
    // All images are now in MongoDB - imagePath is the PDF ID
    return '${ApiConfig.baseUrl}/api/scanner-enterprise/pdf-public/$imagePath';
  }
  
  /// Check if an image path is a valid MongoDB ID
  static bool isValidMongoId(String imagePath) {
    return imagePath.length == 24 && 
           RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(imagePath);
  }
}
