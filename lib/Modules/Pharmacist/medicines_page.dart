// // lib/Modules/Pharmacist/medicines_page.dart
// export 'medicines_page_enterprise.dart';
//
// class _PharmacistMedicinesPageState extends State<PharmacistMedicinesPage> {
//   final _searchController = TextEditingController();
//
//   @override
//   void dispose() {
//     _searchController.dispose();
//     super.dispose();
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Padding(
//       padding: const EdgeInsets.all(24),
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.start,
//         children: [
//           Row(
//             children: [
//               Expanded(
//                 child: TextField(
//                   controller: _searchController,
//                   decoration: InputDecoration(
//                     hintText: 'Search medicines...',
//                     prefixIcon: const Icon(Iconsax.search_normal),
//                     border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
//                     filled: true,
//                     fillColor: AppColors.cardBackground,
//                   ),
//                 ),
//               ),
//               const SizedBox(width: 16),
//               ElevatedButton.icon(
//                 onPressed: () {},
//                 icon: const Icon(Iconsax.add),
//                 label: const Text('Add Medicine'),
//                 style: ElevatedButton.styleFrom(
//                   backgroundColor: AppColors.primary,
//                   foregroundColor: Colors.white,
//                   padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
//                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
//                 ),
//               ),
//             ],
//           ),
//           const SizedBox(height: 24),
//           Expanded(child: _buildMedicinesTable()),
//         ],
//       ),
//     );
//   }
//
//   Widget _buildMedicinesTable() {
//     return Container(
//       decoration: BoxDecoration(
//         color: AppColors.cardBackground,
//         borderRadius: BorderRadius.circular(16),
//         border: Border.all(color: AppColors.kMuted),
//       ),
//       child: Column(
//         children: [
//           Container(
//             padding: const EdgeInsets.all(16),
//             decoration: BoxDecoration(
//               border: Border(bottom: BorderSide(color: AppColors.kMuted)),
//             ),
//             child: Row(
//               children: [
//                 Expanded(flex: 3, child: Text('Medicine Name', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 2, child: Text('Category', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Stock', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Price', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//                 Expanded(flex: 1, child: Text('Actions', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.kTextPrimary))),
//               ],
//             ),
//           ),
//           Expanded(
//             child: ListView.builder(
//               itemCount: 10,
//               itemBuilder: (context, index) {
//                 final stock = 50 - (index * 5);
//                 final isLowStock = stock < 20;
//                 return Container(
//                   padding: const EdgeInsets.all(16),
//                   decoration: BoxDecoration(
//                     border: Border(bottom: BorderSide(color: AppColors.kMuted.withValues(alpha: 0.5))),
//                     color: index.isEven ? Colors.transparent : AppColors.kBg,
//                   ),
//                   child: Row(
//                     children: [
//                       Expanded(flex: 3, child: Text('Medicine ${index + 1}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary))),
//                       Expanded(flex: 2, child: Text('Category ${(index % 3) + 1}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextSecondary))),
//                       Expanded(
//                         flex: 1,
//                         child: Container(
//                           padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
//                           decoration: BoxDecoration(
//                             color: isLowStock ? const Color(0xFFDC2626).withValues(alpha: 0.1) : const Color(0xFF22C55E).withValues(alpha: 0.1),
//                             borderRadius: BorderRadius.circular(6),
//                           ),
//                           child: Text('$stock', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: isLowStock ? const Color(0xFFDC2626) : const Color(0xFF22C55E))),
//                         ),
//                       ),
//                       Expanded(flex: 1, child: Text('\$${(10 + index * 2).toStringAsFixed(2)}', style: GoogleFonts.inter(fontSize: 14, color: AppColors.kTextPrimary))),
//                       Expanded(
//                         flex: 1,
//                         child: Row(
//                           children: [
//                             IconButton(icon: const Icon(Iconsax.edit, size: 18), onPressed: () {}, tooltip: 'Edit'),
//                             IconButton(icon: const Icon(Iconsax.trash, size: 18), onPressed: () {}, tooltip: 'Delete', color: const Color(0xFFDC2626)),
//                           ],
//                         ),
//                       ),
//                     ],
//                   ),
//                 );
//               },
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }
