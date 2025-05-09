-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:4306
-- Generation Time: Mar 10, 2025 at 08:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `login`
--

-- --------------------------------------------------------

--
-- Table structure for table `candidate ranking`
--

CREATE TABLE `candidate ranking` (
  `id` int(11) NOT NULL,
  `Rank` int(11) DEFAULT NULL,
  `Timestamp` datetime DEFAULT NULL,
  `Full_Name` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Phone_No` varchar(20) DEFAULT NULL,
  `Domain` varchar(50) DEFAULT NULL,
  `Sub_Domain` varchar(50) DEFAULT NULL,
  `Marks` int(11) DEFAULT NULL,
  `Completion_of_MCQ` int(11) DEFAULT NULL,
  `Date` int(11) DEFAULT NULL,
  `Month` varchar(20) DEFAULT NULL,
  `Year` int(11) DEFAULT NULL,
  `Selection_Email` varchar(100) NOT NULL DEFAULT '0',
  `email_status` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `candidate ranking`
--

INSERT INTO `candidate ranking` (`id`, `Rank`, `Timestamp`, `Full_Name`, `Email`, `Phone_No`, `Domain`, `Sub_Domain`, `Marks`, `Completion_of_MCQ`, `Date`, `Month`, `Year`, `Selection_Email`, `email_status`) VALUES
(1, 1, '2023-04-20 10:00:00', 'Alice Smith', 'awalegaonkaromkar355@gmail.com', '1111111111', 'IT', 'Software', 90, 1, 20, 'April', 2023, '0', 1);

-- --------------------------------------------------------

--
-- Table structure for table `form1data`
--

CREATE TABLE `form1data` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `location` varchar(100) NOT NULL,
  `college` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_sent` tinyint(1) DEFAULT 0,
  `token_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `form1data`
--

INSERT INTO `form1data` (`id`, `name`, `email`, `phone`, `gender`, `location`, `college`, `created_at`, `email_sent`, `token_url`) VALUES
(2, 'Bob Smiths', 'awalegaonkaromkar355@gmail.com', '0987654321', 'Male', 'Los Angeles', 'UCLA', '2025-03-04 08:39:53', 1, 'http://localhost:3000/?token=2476644f12e9254a'),
(32, 'jason chang', 'awalegaonkaromkar355@gmail.com', '9898989898', 'Male', 'gttt', 'sgggg', '2025-03-09 10:30:48', 1, 'http://localhost:3000/?token=251f202da170f501');

-- --------------------------------------------------------

--
-- Table structure for table `franchiselogindata`
--

CREATE TABLE `franchiselogindata` (
  `id` int(11) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Organization name` varchar(255) NOT NULL,
  `Timestamp` datetime DEFAULT current_timestamp(),
  `Otp` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `franchiselogindata`
--

INSERT INTO `franchiselogindata` (`id`, `Email`, `Password`, `Organization name`, `Timestamp`, `Otp`) VALUES
(4, 'awalegaonkaromkar355@gmail.com', 'jason@123', 'jason', '2025-03-10 03:45:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `imported data`
--

CREATE TABLE `imported data` (
  `id` int(11) NOT NULL,
  `full name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone no` varchar(50) DEFAULT NULL,
  `token_url` varchar(255) DEFAULT NULL,
  `email_sent` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `imported data`
--

INSERT INTO `imported data` (`id`, `full name`, `email`, `phone no`, `token_url`, `email_sent`) VALUES
(1, 'Omkar W', 'awalegaokaromkar1902@gmail.com', '8787867654', 'http://localhost:3000/?token=5dcccca4388f6fa3', 1),
(2, 'Omkar A', 'awalegaonkaromkar355@gmail.com', '8765676567', 'http://localhost:3000/?token=63f81ff95c28b06e', 1),
(3, 'Omkar A', 'awalegaonkaromkar355@gmail.com', '8787878788', 'http://localhost:3000/?token=b33cff14a16a4b06', 1),
(4, 'John Doe', 'john.doe@example.com', '9876543210', 'http://localhost:3000/?token=6a1162815902df8a', 1),
(5, 'Jane Smith', 'jane.smith@example.com', '1234567890', 'http://localhost:3000/?token=0364c1279e8e7d17', 1),
(6, 'Michael Brown', 'michael.brown@example.com', '5551234567', 'http://localhost:3000/?token=981d5cb6b698ff64', 1),
(7, 'Emily Davis', 'emily.davis@example.com', '4445556666', 'http://localhost:3000/?token=685136672e47021b', 1),
(8, 'William Johnson', 'william.johnson@example.com', '3334445555', 'http://localhost:3000/?token=74fb3b55316a4576', 1),
(9, 'Olivia Martinez', 'olivia.martinez@example.com', '2223334444', 'http://localhost:3000/?token=771c95578f4acb39', 1),
(10, 'Liam Garcia', 'liam.garcia@example.com', '1112223333', 'http://localhost:3000/?token=5b0cba5475435644', 1),
(11, 'Sophia Wilson', 'sophia.wilson@example.com', '9998887777', 'http://localhost:3000/?token=1305d8f9091605b8', 1),
(12, 'James Anderson', 'james.anderson@example.com', '8887776666', 'http://localhost:3000/?token=46a4cbe07537c2f9', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`) VALUES
(6, 'awalegaonkaromkar355@gmail.com', 'jason@123');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `candidate ranking`
--
ALTER TABLE `candidate ranking`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `form1data`
--
ALTER TABLE `form1data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `franchiselogindata`
--
ALTER TABLE `franchiselogindata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`Email`);

--
-- Indexes for table `imported data`
--
ALTER TABLE `imported data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `candidate ranking`
--
ALTER TABLE `candidate ranking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `form1data`
--
ALTER TABLE `form1data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `franchiselogindata`
--
ALTER TABLE `franchiselogindata`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `imported data`
--
ALTER TABLE `imported data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
