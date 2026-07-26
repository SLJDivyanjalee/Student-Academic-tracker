-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 25, 2026 at 06:22 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `levelup`
--

-- --------------------------------------------------------

--
-- Table structure for table `assignments_exams`
--

CREATE TABLE `assignments_exams` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `item_type` enum('assignment','exam') NOT NULL,
  `weight` decimal(5,2) DEFAULT 0.00,
  `submission_status` varchar(40) DEFAULT NULL,
  `venue` varchar(120) DEFAULT NULL,
  `exam_type` varchar(60) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assignments_exams`
--

INSERT INTO `assignments_exams` (`id`, `user_id`, `title`, `description`, `due_date`, `subject_id`, `item_type`, `weight`, `submission_status`, `venue`, `exam_type`, `created_at`) VALUES
(6, 4, 'Linear algebra assignment', NULL, '2026-07-24', 12, 'assignment', 0.00, 'not_started', NULL, NULL, '2026-07-23 13:25:34'),
(7, 4, 'oop mid exam', NULL, '2026-07-28', 11, 'exam', 0.00, NULL, NULL, NULL, '2026-07-23 13:25:53');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `lecture_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `user_id`, `subject_id`, `lecture_id`, `date`, `status`) VALUES
(8, 4, 12, 16, '2026-07-24', 'present'),
(9, 4, 13, 15, '2026-07-24', 'present'),
(10, 4, 13, 17, '2026-07-24', 'present');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `token` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`token`, `user_id`, `expires_at`, `used`, `created_at`) VALUES
('XiqTofrQz8hEljA3Hv_WeefG1vQDHoJfFxrYQMjDRUj97ujp_dnhMK5rcBtO6dxf', 4, '2026-07-23 14:14:08', 0, '2026-07-23 19:14:09');

-- --------------------------------------------------------

--
-- Table structure for table `planner_settings`
--

CREATE TABLE `planner_settings` (
  `user_id` int(11) NOT NULL,
  `work_start` time NOT NULL DEFAULT '07:00:00',
  `work_end` time NOT NULL DEFAULT '22:00:00',
  `daily_cap_minutes` int(11) NOT NULL DEFAULT 120,
  `rest_on_holidays` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `planner_settings`
--

INSERT INTO `planner_settings` (`user_id`, `work_start`, `work_end`, `daily_cap_minutes`, `rest_on_holidays`) VALUES
(4, '07:00:00', '22:00:00', 600, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `token` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`token`, `user_id`, `created_at`, `expires_at`) VALUES
('-D77hUrJ3uX1cCtilKD42YQIlewRZjIKYutGV46jEDf29FUFcmBBsuo3rB5SaOOJ', 4, '2026-07-23 19:33:17', '2026-08-22 14:03:17'),
('0d-spCEaDMwc4m2oizKQvyJGcb4lt1KZrRJnLyxyZR9hXQxyoXWsu_24_vhgvU_3', 4, '2026-07-24 17:21:27', '2026-08-23 11:51:27'),
('7TuNi3EvTHdIrXOVUL02SOP9UOAuFTVwSs9vxsR9XxnkUPCF1BhDmRHica9GB5Qv', 4, '2026-07-25 09:38:55', '2026-08-24 04:08:55'),
('byXqPN4eR7dBUrOVHbK1pWqE04kVq0n7PZW36m2YLCM6QGEgGnRK_iQ_HADfo4q3', 4, '2026-07-24 04:24:32', '2026-08-22 22:54:32'),
('jzJiOEsVuv24NQO7EH1bqpI4pmAcZfMkoubRrwX2ys2JAj6BxTTm2dOhh7f1CsFK', 4, '2026-07-25 09:47:26', '2026-08-24 04:17:26');

-- --------------------------------------------------------

--
-- Table structure for table `study_sessions`
--

CREATE TABLE `study_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `session_type` enum('regular','exam_prep') NOT NULL DEFAULT 'regular',
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `color_hex` varchar(7) DEFAULT '#7c3aed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `user_id`, `name`, `color_hex`) VALUES
(11, 4, 'computer science', '#7c3aed'),
(12, 4, 'Mathematics', '#7c3aed'),
(13, 4, 'statistics', '#7c3aed');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `status` enum('pending','progress','done') NOT NULL DEFAULT 'pending',
  `urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `category` varchar(80) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `description`, `due_date`, `subject_id`, `status`, `urgency`, `category`, `created_at`) VALUES
(5, 4, 'OOP final project', NULL, '2026-07-26', 11, 'pending', 'high', NULL, '2026-07-23 13:23:19'),
(6, 4, 'Real Analysis Revision', NULL, '2026-07-24', 12, 'pending', 'medium', NULL, '2026-07-23 13:23:50'),
(7, 4, 'Inferential Statistics study', NULL, '2026-07-27', 13, 'pending', 'low', NULL, '2026-07-23 13:24:59'),
(8, 4, 'Rotaract meeting', NULL, '2026-07-27', NULL, 'pending', 'low', NULL, '2026-07-23 14:03:59'),
(9, 4, 'Rotaract monthly gathering', NULL, '2026-07-27', NULL, 'pending', 'medium', 'Rotaract', '2026-07-23 23:40:37');

-- --------------------------------------------------------

--
-- Table structure for table `timetable_lectures`
--

CREATE TABLE `timetable_lectures` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `day_of_week` enum('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `location` varchar(120) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `timetable_lectures`
--

INSERT INTO `timetable_lectures` (`id`, `user_id`, `subject_id`, `day_of_week`, `start_time`, `end_time`, `location`) VALUES
(1, 4, 12, 'Mon', '08:00:00', '09:45:00', 'Tutorial'),
(2, 4, 11, 'Mon', '10:15:00', '12:00:00', 'Data Structured Algorithm'),
(3, 4, 12, 'Mon', '13:00:00', '14:45:00', 'MATLAB'),
(4, 4, 11, 'Mon', '15:15:00', '16:45:00', 'Tutorial'),
(5, 4, 13, 'Tue', '08:00:00', '09:45:00', 'Inferential Statistics'),
(6, 4, 12, 'Tue', '13:00:00', '14:45:00', 'Numerical Method'),
(8, 4, 11, 'Wed', '08:00:00', '09:45:00', 'Object Oriented Programming'),
(9, 4, 11, 'Wed', '10:15:00', '12:00:00', 'Computer System Architecture'),
(10, 4, 11, 'Wed', '13:00:00', '14:45:00', 'Tutorial'),
(12, 4, 12, 'Thu', '08:00:00', '09:45:00', 'Real Analysis'),
(14, 4, 11, 'Thu', '10:15:00', '12:00:00', 'Practical'),
(15, 4, 13, 'Fri', '10:15:00', '12:00:00', 'Non Parametric Statistics'),
(16, 4, 12, 'Fri', '08:00:00', '09:45:00', 'Linear Algebra II'),
(17, 4, 13, 'Fri', '13:00:00', '14:45:00', 'Sampling Techniques'),
(18, 4, 12, 'Thu', '13:00:00', '14:45:00', 'tutorial');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_salt` varchar(255) NOT NULL,
  `faculty` varchar(120) DEFAULT NULL,
  `semester` varchar(60) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `notifications_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `onboarding_complete` tinyint(1) NOT NULL DEFAULT 1,
  `onboarding_subjects_count` int(11) DEFAULT NULL,
  `notify_assignment_reminders` tinyint(1) NOT NULL DEFAULT 1,
  `notify_exam_reminders` tinyint(1) NOT NULL DEFAULT 1,
  `notify_study_reminders` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `password_salt`, `faculty`, `semester`, `avatar_url`, `notifications_enabled`, `created_at`, `onboarding_complete`, `onboarding_subjects_count`, `notify_assignment_reminders`, `notify_exam_reminders`, `notify_study_reminders`) VALUES
(4, 'Shehani Fernando', 'shehani@gmail.com', 't/db75SFQc0HRMivkGKi+RvobnsuAtsGeD0fXrgXerk=', 'ErogJqcHfIFwuRAs+VHlnQ==', NULL, 'Semester 3', 'data:image/jpeg;base64,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', 1, '2026-07-23 18:43:11', 1, 3, 1, 1, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assignments_exams`
--
ALTER TABLE `assignments_exams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_attendance_lecture_day` (`user_id`,`lecture_id`,`date`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `fk_attendance_lecture` (`lecture_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `planner_settings`
--
ALTER TABLE `planner_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `study_sessions`
--
ALTER TABLE `study_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `timetable_lectures`
--
ALTER TABLE `timetable_lectures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assignments_exams`
--
ALTER TABLE `assignments_exams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `study_sessions`
--
ALTER TABLE `study_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `timetable_lectures`
--
ALTER TABLE `timetable_lectures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments_exams`
--
ALTER TABLE `assignments_exams`
  ADD CONSTRAINT `assignments_exams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_exams_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attendance_lecture` FOREIGN KEY (`lecture_id`) REFERENCES `timetable_lectures` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `planner_settings`
--
ALTER TABLE `planner_settings`
  ADD CONSTRAINT `planner_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `study_sessions`
--
ALTER TABLE `study_sessions`
  ADD CONSTRAINT `study_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `study_sessions_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `timetable_lectures`
--
ALTER TABLE `timetable_lectures`
  ADD CONSTRAINT `timetable_lectures_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `timetable_lectures_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
