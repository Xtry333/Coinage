-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Wersja serwera:               8.0.23 - MySQL Community Server - GPL
-- Serwer OS:                    Linux
-- HeidiSQL Wersja:              11.2.0.6290
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Zrzut struktury bazy danych coinage-db
CREATE DATABASE IF NOT EXISTS `coinage-db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `coinage-db`;

-- Zrzut struktury tabela coinage-db.category
CREATE TABLE IF NOT EXISTS `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `parent` int DEFAULT NULL,
  `type` enum('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `FK_category_category` (`parent`),
  CONSTRAINT `FK_category_category` FOREIGN KEY (`parent`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.category: ~16 rows (około)
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
REPLACE INTO `category` (`id`, `name`, `description`, `parent`, `type`) VALUES
	(1, 'Paliwo', NULL, 2, 'OUTCOME'),
	(2, 'Samochód', 'Wydatki na samochów', NULL, 'OUTCOME'),
	(3, 'Do domu', 'Łacznik ogólnych wydatków na mieszkanie i do domu', NULL, 'OUTCOME'),
	(4, 'Wyszeckiego', 'Mieszkanie na Wyszeckiego', 3, 'OUTCOME'),
	(5, 'Rozrywka', 'Gry, kino, teatr, itd', NULL, 'OUTCOME'),
	(6, 'Gry', NULL, 5, 'OUTCOME'),
	(7, 'Prezent', NULL, NULL, 'OUTCOME'),
	(8, 'Jedzenie', NULL, NULL, 'OUTCOME'),
	(9, 'Kainos Income', NULL, NULL, 'INCOME'),
	(10, 'Inne', NULL, NULL, 'OUTCOME'),
	(11, 'Alkohol', NULL, NULL, 'OUTCOME'),
	(12, 'Restauracja', NULL, 8, 'OUTCOME'),
	(14, 'Transport', NULL, NULL, 'OUTCOME'),
	(15, 'Dla zwierząt', NULL, 3, 'OUTCOME'),
	(16, 'Steam', NULL, 6, 'OUTCOME'),
	(17, 'Zdrowe', 'Zdrowe jedzenie', 8, 'OUTCOME');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.contractor
CREATE TABLE IF NOT EXISTS `contractor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.contractor: ~19 rows (około)
/*!40000 ALTER TABLE `contractor` DISABLE KEYS */;
REPLACE INTO `contractor` (`id`, `name`) VALUES
	(1, 'Allegro'),
	(2, 'Media Expert'),
	(3, 'Nintendo Switch Store'),
	(4, 'Steam'),
	(5, 'Magda Kuczera'),
	(6, 'Agata  Meble'),
	(7, 'Biedronka'),
	(8, 'Lidl'),
	(9, 'Auchan'),
	(10, 'Orlen'),
	(11, 'Ikea'),
	(12, 'KFC'),
	(13, 'Pepco'),
	(14, 'Mac Donald\'s'),
	(15, 'AliExpress'),
	(16, 'Spotify'),
	(17, 'Rossman'),
	(18, 'Decathlon'),
	(19, 'MZKZG');
/*!40000 ALTER TABLE `contractor` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.income
CREATE TABLE IF NOT EXISTS `income` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.income: ~0 rows (około)
/*!40000 ALTER TABLE `income` DISABLE KEYS */;
/*!40000 ALTER TABLE `income` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.receipt
CREATE TABLE IF NOT EXISTS `receipt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `date` date DEFAULT NULL,
  `amount` decimal(20,2) NOT NULL,
  `contractor` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_receipt_contractor` (`contractor`),
  CONSTRAINT `FK_receipt_contractor` FOREIGN KEY (`contractor`) REFERENCES `contractor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.receipt: ~2 rows (około)
/*!40000 ALTER TABLE `receipt` DISABLE KEYS */;
REPLACE INTO `receipt` (`id`, `description`, `date`, `amount`, `contractor`) VALUES
	(1, NULL, '2021-05-25', 401.30, 9),
	(2, 'Lenovo Legion Y740-17', '2020-05-03', 7806.99, 1);
/*!40000 ALTER TABLE `receipt` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.transfer
CREATE TABLE IF NOT EXISTS `transfer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `amount` decimal(20,2) NOT NULL DEFAULT '0.00',
  `category` int NOT NULL,
  `contractor` int DEFAULT NULL,
  `type` enum('INCOME','OUTCOME') NOT NULL DEFAULT 'OUTCOME',
  `date` date DEFAULT NULL,
  `edited_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_date` timestamp NULL DEFAULT NULL,
  `receipt` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_transfer_receipt` (`receipt`),
  KEY `FK_transfer_category` (`category`),
  KEY `FK_transfer_contractor` (`contractor`),
  CONSTRAINT `FK_transfer_category` FOREIGN KEY (`category`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FK_transfer_contractor` FOREIGN KEY (`contractor`) REFERENCES `contractor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_transfer_receipt` FOREIGN KEY (`receipt`) REFERENCES `receipt` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.transfer: ~137 rows (około)
/*!40000 ALTER TABLE `transfer` DISABLE KEYS */;
REPLACE INTO `transfer` (`id`, `description`, `amount`, `category`, `contractor`, `type`, `date`, `edited_date`, `created_date`, `receipt`) VALUES
	(1, 'Roborock S6 MaxV', 2405.00, 3, 2, 'OUTCOME', '2021-03-23', '2021-05-11 21:44:22', '2021-05-11 23:44:21', NULL),
	(2, 'Mieszkanie Kaucja', 1600.00, 4, 5, 'OUTCOME', '2021-04-10', '2021-05-11 21:44:24', '2021-05-11 23:44:24', NULL),
	(3, 'Nintendo Switch + Dodatki', 1964.96, 5, 2, 'OUTCOME', '2020-12-19', '2021-05-22 20:04:14', '2021-05-11 23:44:16', NULL),
	(4, 'Najem', 1600.00, 4, 5, 'OUTCOME', '2021-04-12', '2021-05-11 21:44:25', '2021-05-11 23:44:25', NULL),
	(5, 'Materac piankowy Calio 160x200', 749.00, 3, 1, 'OUTCOME', '2021-04-12', '2021-05-11 21:44:25', '2021-05-11 23:44:25', NULL),
	(6, 'Uniwersalna Srebrna Metalowa Półka', 117.90, 3, 1, 'OUTCOME', '2021-04-24', '2021-05-11 21:44:27', '2021-05-11 23:44:27', NULL),
	(7, 'Fotele Hexagon x2', 298.00, 3, 6, 'OUTCOME', '2021-04-16', '2021-05-11 21:44:26', '2021-05-11 23:44:25', NULL),
	(8, 'Dywanik 80x150', 135.00, 3, 1, 'OUTCOME', '2021-04-26', '2021-05-11 21:44:27', '2021-05-11 23:44:27', NULL),
	(9, 'Bomba na Pchły', 73.98, 4, 1, 'OUTCOME', '2021-04-21', '2021-05-11 21:44:27', '2021-05-11 23:44:26', NULL),
	(10, 'Dywanik 50x80', 53.99, 3, 1, 'OUTCOME', '2021-04-16', '2021-05-11 21:44:26', '2021-05-11 23:44:26', NULL),
	(11, 'Najem', 1600.00, 4, 5, 'OUTCOME', '2021-05-07', '2021-05-11 21:44:38', '2021-05-11 23:44:38', NULL),
	(12, 'Notariusz Umowa Egzekucja', 307.00, 4, NULL, 'OUTCOME', '2021-04-28', '2021-05-11 21:44:28', '2021-05-11 23:44:28', NULL),
	(13, 'Folia Tunelowa 8x2', 43.20, 4, 1, 'OUTCOME', '2021-05-02', '2021-05-11 21:44:30', '2021-05-11 23:44:30', NULL),
	(14, 'Farby Akr Zestaw', 48.99, 7, 1, 'OUTCOME', '2021-05-02', '2021-05-11 21:44:30', '2021-05-11 23:44:30', NULL),
	(15, 'Farby Akr Zestaw XL', 166.77, 7, 1, 'OUTCOME', '2021-05-02', '2021-05-11 21:44:29', '2021-05-11 23:44:29', NULL),
	(16, 'Kainos Income', 5199.54, 9, NULL, 'INCOME', '2021-04-08', '2021-05-11 21:44:24', '2021-05-11 23:44:24', NULL),
	(17, 'Kainos Income', 5199.54, 9, NULL, 'INCOME', '2021-05-07', '2021-05-11 21:44:38', '2021-05-11 23:44:37', NULL),
	(18, 'Paliwo 5,44 PLN/L', 139.21, 1, 10, 'OUTCOME', '2021-04-28', '2021-05-15 21:29:23', '2021-05-11 23:44:28', NULL),
	(19, 'Bemi Cognita Ebook Reader', 294.99, 7, 1, 'OUTCOME', '2021-05-07', '2021-05-11 21:44:35', '2021-05-11 23:44:34', NULL),
	(20, 'Zakupy', 104.18, 8, 9, 'OUTCOME', '2021-05-05', '2021-05-11 21:44:32', '2021-05-11 23:44:32', NULL),
	(21, 'Zakupy', 77.87, 8, 7, 'OUTCOME', '2021-05-04', '2021-05-11 21:44:32', '2021-05-11 23:44:31', NULL),
	(22, 'Notesy Lookah', 117.00, 7, NULL, 'OUTCOME', '2021-05-05', '2021-05-11 21:44:33', '2021-05-11 23:44:33', NULL),
	(23, 'Pizza', 92.50, 8, NULL, 'OUTCOME', '2021-05-06', '2021-05-11 21:44:37', '2021-05-11 23:44:33', NULL),
	(24, 'Zakupy', 154.16, 8, 7, 'OUTCOME', '2021-05-02', '2021-05-11 21:44:31', '2021-05-11 23:44:30', NULL),
	(25, 'Zakupy', 55.77, 8, 7, 'OUTCOME', '2021-05-02', '2021-05-11 21:44:31', '2021-05-11 23:44:31', NULL),
	(26, 'Zakupy', 148.50, 8, 7, 'OUTCOME', '2021-05-01', '2021-05-11 21:44:29', '2021-05-11 23:44:29', NULL),
	(27, 'Poduchy', 101.95, 3, 11, 'OUTCOME', '2021-05-08', '2021-05-11 21:44:39', '2021-05-11 23:44:38', NULL),
	(28, 'KFC', 63.25, 12, 12, 'OUTCOME', '2021-05-08', '2021-05-11 21:44:39', '2021-05-11 23:44:39', NULL),
	(29, 'Rzeczy na sushi', 52.97, 8, 1, 'OUTCOME', '2021-03-28', '2021-05-11 21:44:23', '2021-05-11 23:44:23', NULL),
	(30, 'Skyn x48', 64.99, 10, 1, 'OUTCOME', '2021-04-08', '2021-05-11 21:44:23', '2021-05-11 23:44:23', NULL),
	(31, 'Satisfactory', 99.00, 6, 4, 'OUTCOME', '2021-05-09', '2021-05-11 21:44:40', '2021-05-11 23:44:40', NULL),
	(32, 'Rzeczy do sushi dalnet', 104.59, 8, 1, 'OUTCOME', '2021-05-10', '2021-05-11 21:44:41', '2021-05-11 23:44:41', NULL),
	(33, 'Żarcie i rzeczy na driny', 69.33, 8, 8, 'OUTCOME', '2021-05-08', '2021-05-11 21:44:40', '2021-05-11 23:44:39', NULL),
	(34, 'Odnowienie willawozniak.pl', 110.68, 10, NULL, 'OUTCOME', '2021-05-11', '2021-05-11 21:44:41', '2021-05-11 23:44:41', NULL),
	(35, 'Zakupy Biedro Rumia', 127.40, 8, 7, 'OUTCOME', '2021-05-11', '2021-05-22 19:43:16', '2021-05-11 23:44:42', NULL),
	(36, 'Paliwo 5,44 PLN/L', 114.68, 1, 10, 'OUTCOME', '2021-05-11', '2021-05-15 21:28:44', '2021-05-11 23:44:42', NULL),
	(37, 'Toshii Sushi x2', 29.98, 12, 7, 'OUTCOME', '2021-05-11', '2021-05-13 23:01:51', '2021-05-11 23:44:43', NULL),
	(38, 'Lild zakupy', 11.99, 7, 8, 'OUTCOME', '2021-05-11', '2021-05-12 16:34:55', '2021-05-12 16:34:57', NULL),
	(39, 'Sapporo Sushi x2', 39.98, 12, 8, 'OUTCOME', '2021-05-13', '2021-05-13 23:01:48', '2021-05-14 00:57:11', NULL),
	(40, 'Auchaun zakupy jedzenie, doniczki', 354.91, 8, 9, 'OUTCOME', '2021-05-13', '2021-05-13 22:58:02', '2021-05-14 00:58:01', NULL),
	(41, 'Lidl tictaki', 16.61, 8, 8, 'OUTCOME', '2021-05-13', '2021-05-14 01:00:29', '2021-05-14 01:00:30', NULL),
	(42, 'Sakuro Sushi x2', 35.98, 12, 7, 'OUTCOME', '2021-05-13', '2021-05-13 23:01:45', '2021-05-14 01:01:29', NULL),
	(44, 'Lody kuleczkowe Mini Melts x2', 16.00, 8, NULL, 'OUTCOME', '2021-05-14', '2021-05-22 19:38:07', '2021-05-14 21:08:35', NULL),
	(45, 'Łycha i noże', 25.00, 3, 2, 'OUTCOME', '2021-05-12', '2021-05-16 13:08:01', '2021-05-16 15:07:59', NULL),
	(46, 'Łycha i noże', 25.00, 3, 13, 'OUTCOME', '2021-05-14', '2021-05-14 19:14:58', '2021-05-14 21:14:28', NULL),
	(47, 'Internet (maj)', 60.23, 4, NULL, 'OUTCOME', '2021-05-08', '2021-05-15 01:20:57', '2021-05-15 01:20:58', NULL),
	(48, 'Maszynka do golenia Raven', 109.99, 3, NULL, 'OUTCOME', '2020-08-22', '2021-05-15 13:12:37', '2021-05-15 13:12:38', NULL),
	(49, 'Paliwo 5,43 PLN/L', 99.04, 1, 10, 'OUTCOME', '2021-05-23', '2021-05-23 16:58:43', '2021-05-22 20:27:28', NULL),
	(50, 'Słodycze', 69.35, 8, 7, 'OUTCOME', '2021-05-15', '2021-05-15 21:16:56', '2021-05-15 23:16:55', NULL),
	(51, 'Burger', 4.50, 12, 14, 'OUTCOME', '2021-05-15', '2021-05-15 21:17:18', '2021-05-15 23:16:53', NULL),
	(52, 'Burgery', 45.90, 12, 14, 'OUTCOME', '2021-05-15', '2021-05-15 23:17:46', '2021-05-15 23:17:48', NULL),
	(53, 'Paliwo 5,44 PLN/L', 151.99, 1, 10, 'OUTCOME', '2021-04-08', '2021-05-15 23:31:22', '2021-05-15 23:31:24', NULL),
	(54, 'Budynie i picie', 27.77, 8, 8, 'OUTCOME', '2021-05-17', '2021-05-17 20:20:44', '2021-05-17 20:20:45', NULL),
	(55, 'Inface Peeling Kawitacyjny', 99.00, 10, 1, 'OUTCOME', '2021-05-19', '2021-05-19 15:55:29', '2021-05-19 15:55:30', NULL),
	(56, 'Plecak Sowa', 45.36, 10, 15, 'OUTCOME', '2021-05-20', '2021-05-19 22:58:08', '2021-05-20 00:57:46', NULL),
	(57, 'Q10', 36.99, 10, 17, 'OUTCOME', '2021-05-21', '2021-05-22 19:05:12', '2021-05-21 22:42:26', NULL),
	(58, 'Biedro rzeczy', 25.26, 8, 7, 'OUTCOME', '2021-05-21', '2021-05-21 22:43:08', '2021-05-21 22:43:08', NULL),
	(60, 'Lenovo Legion Y740-17', 0.00, 10, 1, 'OUTCOME', '2020-05-03', '2021-05-25 21:37:17', '2021-05-22 12:56:29', 2),
	(62, 'Plecak Sowa Shipping Fee', 3.84, 10, 15, 'OUTCOME', '2021-05-22', '2021-05-22 20:43:20', '2021-05-22 20:43:20', NULL),
	(63, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2019-09-11', '2021-05-22 18:58:38', '2021-05-22 20:58:17', NULL),
	(64, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2019-10-11', '2021-05-22 18:58:38', '2021-05-22 20:58:17', NULL),
	(65, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2019-11-11', '2021-05-22 18:58:38', '2021-05-22 20:58:17', NULL),
	(66, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2019-12-11', '2021-05-22 18:58:38', '2021-05-22 20:58:17', NULL),
	(67, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-01-11', '2021-05-22 18:58:38', '2021-05-22 20:58:17', NULL),
	(68, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-02-11', '2021-05-22 18:59:33', '2021-05-22 20:58:17', NULL),
	(69, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-03-11', '2021-05-22 19:00:13', '2021-05-22 20:58:17', NULL),
	(70, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-04-11', '2021-05-22 19:00:19', '2021-05-22 20:58:17', NULL),
	(71, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-05-11', '2021-05-22 19:00:23', '2021-05-22 20:58:17', NULL),
	(72, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-06-11', '2021-05-22 19:00:27', '2021-05-22 20:58:17', NULL),
	(73, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-07-11', '2021-05-22 19:00:31', '2021-05-22 20:58:17', NULL),
	(74, 'Spotify Student', 9.99, 5, 16, 'OUTCOME', '2020-08-11', '2021-05-22 19:00:35', '2021-05-22 20:58:17', NULL),
	(75, 'Spotify Solo', 19.99, 5, 16, 'OUTCOME', '2020-09-11', '2021-05-22 19:04:03', '2021-05-22 20:58:17', NULL),
	(76, 'Spotify Solo', 19.99, 5, 16, 'OUTCOME', '2020-10-11', '2021-05-22 19:04:07', '2021-05-22 20:58:17', NULL),
	(77, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2020-11-14', '2021-05-22 19:04:21', '2021-05-22 20:58:17', NULL),
	(78, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2020-12-11', '2021-05-22 19:04:36', '2021-05-22 20:58:17', NULL),
	(79, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2021-01-11', '2021-05-22 19:04:36', '2021-05-22 20:58:17', NULL),
	(80, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2021-02-11', '2021-05-22 19:04:35', '2021-05-22 20:58:17', NULL),
	(81, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2021-03-11', '2021-05-22 19:04:35', '2021-05-22 20:58:17', NULL),
	(82, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2021-04-11', '2021-05-22 19:04:34', '2021-05-22 20:58:17', NULL),
	(83, 'Spotify Duo', 24.99, 5, 16, 'OUTCOME', '2021-05-11', '2021-05-22 19:04:32', '2021-05-22 20:58:17', NULL),
	(84, 'Doładowanie Tel Play', 40.00, 10, NULL, 'OUTCOME', '2021-05-15', '2021-05-22 19:38:52', '2021-05-22 21:38:51', NULL),
	(85, 'Zakupy Biedro Puck', 21.75, 8, 7, 'OUTCOME', '2021-05-11', '2021-05-22 19:42:02', '2021-05-22 19:43:01', NULL),
	(86, 'Samochód Rata', 650.00, 2, NULL, 'OUTCOME', '2021-05-11', '2021-05-22 19:45:08', '2021-05-22 21:45:07', NULL),
	(87, 'Gdyńska Rybka', 18.10, 12, NULL, 'OUTCOME', '2021-05-09', '2021-05-22 19:46:49', '2021-05-22 21:46:49', NULL),
	(88, 'Tort', 99.90, 12, NULL, 'OUTCOME', '2021-05-07', '2021-05-22 19:47:56', '2021-05-22 21:47:55', NULL),
	(89, 'Lenovo Legion Rata', 400.00, 3, NULL, 'OUTCOME', '2021-05-01', '2021-05-22 19:49:19', '2021-05-22 21:49:18', NULL),
	(90, 'Lenovo Legion Rata', 400.00, 3, NULL, 'OUTCOME', '2021-04-01', '2021-05-22 19:49:19', '2021-05-22 21:49:18', NULL),
	(91, 'Lenovo Legion Rata', 400.00, 3, NULL, 'OUTCOME', '2021-03-01', '2021-05-22 19:49:19', '2021-05-22 21:49:18', NULL),
	(92, 'Samochód Rata', 650.00, 2, NULL, 'OUTCOME', '2021-04-11', '2021-05-22 19:45:08', '2021-05-22 21:45:07', NULL),
	(93, 'Samochód Rata', 650.00, 2, NULL, 'OUTCOME', '2021-03-11', '2021-05-22 19:45:08', '2021-05-22 21:45:07', NULL),
	(94, 'Nintendo Gra', 84.50, 6, 3, 'OUTCOME', '2021-04-07', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(95, 'Nintendo Gra', 12.60, 6, 3, 'OUTCOME', '2021-04-07', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(96, 'Kainos Income Premia', 4002.22, 9, NULL, 'INCOME', '2021-04-08', '2021-05-11 21:44:38', '2021-05-22 19:53:32', NULL),
	(97, 'Nintendo Gra', 7.89, 6, 3, 'OUTCOME', '2021-03-21', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(98, 'Nintendo Gra', 14.70, 6, 3, 'OUTCOME', '2021-03-13', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(99, 'Kainos Income', 5199.54, 9, NULL, 'INCOME', '2021-03-08', '2021-05-22 19:56:24', '2021-05-22 19:55:55', NULL),
	(100, 'Nintendo Gra', 124.00, 6, 3, 'OUTCOME', '2021-02-28', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(101, 'Nintendo Gra', 50.00, 6, 3, 'OUTCOME', '2021-02-19', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(102, 'Butki śnieżne', 359.95, 10, 18, 'OUTCOME', '2021-02-19', '2021-05-22 19:58:48', '2021-05-22 21:58:44', NULL),
	(103, 'Nintendo Gra', 9.55, 6, 3, 'OUTCOME', '2021-02-06', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(104, 'Nintendo Gra', 152.98, 6, 3, 'OUTCOME', '2021-01-05', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(105, 'Nintendo Konto', 250.00, 6, 3, 'OUTCOME', '2021-01-01', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(106, 'Nintendo Konto', 250.00, 6, 3, 'OUTCOME', '2020-12-19', '2021-05-22 19:52:37', '2021-05-22 21:52:36', NULL),
	(107, 'Paliwo 5,43 PLN/L', 80.47, 1, 10, 'OUTCOME', '2021-05-15', '2021-05-15 21:28:27', '2021-05-15 23:15:13', NULL),
	(108, 'SKM', 4.90, 14, 19, 'OUTCOME', '2021-05-24', '2021-05-24 17:47:28', '2021-05-24 19:47:27', NULL),
	(109, 'SKM', 4.90, 14, 19, 'OUTCOME', '2021-05-24', '2021-05-24 17:47:28', '2021-05-24 19:47:27', NULL),
	(110, 'ARK: Genesis Season Pass', 124.99, 6, 4, 'OUTCOME', '2021-05-25', '2021-05-25 16:04:35', '2021-05-25 16:04:39', NULL),
	(111, 'Auchan żarcie zdrowe', 260.07, 17, 9, 'OUTCOME', '2021-05-25', '2021-05-25 20:12:34', '2021-05-25 22:01:57', NULL),
	(112, 'Golden Rum + Drinki', 43.95, 11, 9, 'OUTCOME', '2021-05-25', '2021-05-25 20:23:26', '2021-05-25 22:04:33', 1),
	(113, 'Auchan zakupy', 225.01, 8, 9, 'OUTCOME', '2021-05-25', '2021-05-25 20:30:38', '2021-05-25 22:06:03', 1),
	(114, 'Waga', 44.99, 3, 9, 'OUTCOME', '2021-05-25', '2021-05-25 20:14:05', '2021-05-25 22:14:02', 1),
	(115, 'KFC', 41.80, 12, 12, 'OUTCOME', '2021-05-25', '2021-05-25 20:16:41', '2021-05-25 22:15:50', NULL),
	(116, 'Auchan zakupy zdrowe', 87.35, 17, 9, 'OUTCOME', '2021-05-25', '2021-05-25 20:23:59', '2021-05-25 22:06:03', 1),
	(117, 'Paliwo 5,27 PLN/L', 141.03, 1, 10, 'OUTCOME', '2021-03-30', '2021-05-23 16:58:43', '2021-05-25 20:37:24', NULL),
	(118, 'Paliwo 5,43 PLN/L', 104.91, 1, 10, 'OUTCOME', '2021-03-27', '2021-05-23 16:58:43', '2021-05-25 20:38:17', NULL),
	(119, 'Paliwo 5,23 PLN/L', 160.30, 1, 10, 'OUTCOME', '2021-03-08', '2021-05-25 21:31:08', '2021-05-25 20:38:17', NULL),
	(120, 'Paliwo 5,03 PLN/L', 92.30, 1, 10, 'OUTCOME', '2021-02-17', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(121, 'Paliwo 4.75 PLN/L', 146.97, 1, 10, 'OUTCOME', '2021-02-02', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(122, 'Paliwo 4.94 PLN/L', 121.38, 1, 10, 'OUTCOME', '2021-01-17', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(123, 'Paliwo 4.38 PLN/L', 99.91, 1, 10, 'OUTCOME', '2020-07-17', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(124, 'Paliwo 4.36 PLN/L', 129.45, 1, 10, 'OUTCOME', '2020-07-26', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(125, 'Paliwo 4.48 PLN/L', 65.90, 1, 10, 'OUTCOME', '2020-08-08', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(126, 'Paliwo 4.39 PLN/L', 105.62, 1, 10, 'OUTCOME', '2020-08-16', '2021-05-25 20:40:13', '2021-05-25 20:39:21', NULL),
	(127, 'Paliwo 4.45 PLN/L', 112.59, 1, 10, 'OUTCOME', '2020-08-22', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(128, 'Paliwo 4.66 PLN/L', 80.85, 1, 10, 'OUTCOME', '2020-09-06', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(129, 'Paliwo 4.29 PLN/L', 99.87, 1, 10, 'OUTCOME', '2020-10-04', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(130, 'Paliwo 4.58 PLN/L', 138.82, 1, 10, 'OUTCOME', '2020-10-11', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(131, 'Paliwo 4.33 PLN/L', 136.18, 1, 10, 'OUTCOME', '2020-10-13', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(132, 'Paliwo 4.59 PLN/L', 112.59, 1, 10, 'OUTCOME', '2020-10-17', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(133, 'Paliwo 4.48 PLN/L', 105.82, 1, 10, 'OUTCOME', '2020-10-24', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(134, 'Paliwo 4.54 PLN/L', 112.05, 1, 10, 'OUTCOME', '2020-11-08', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(135, 'Paliwo 4.58 PLN/L', 47.08, 1, 10, 'OUTCOME', '2020-11-15', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(136, 'Paliwo 4.48 PLN/L', 136.86, 1, 10, 'OUTCOME', '2020-11-20', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(137, 'Paliwo 4.76 PLN/L', 50.31, 1, 10, 'OUTCOME', '2020-12-01', '2021-05-25 20:56:52', '2021-05-25 20:39:21', NULL),
	(138, 'Paliwo 4.73 PLN/L', 136.13, 1, 10, 'OUTCOME', '2020-12-06', '2021-05-25 20:40:13', '2021-05-25 21:28:29', NULL),
	(139, 'Paliwo 4.62 PLN/L', 137.21, 1, 10, 'OUTCOME', '2020-12-19', '2021-05-25 20:40:13', '2021-05-25 21:28:29', NULL),
	(140, 'Paliwo 5,38 PLN/L', 104.96, 1, 10, 'OUTCOME', '2021-03-20', '2021-05-23 16:58:43', '2021-05-25 20:38:17', NULL),
	(141, 'Paliwo 5,44 PLN/L', 142.04, 1, 10, 'OUTCOME', '2021-05-26', '2021-05-26 20:58:51', '2021-05-26 20:58:27', NULL),
	(142, 'Kwiatek', 40.87, 7, 7, 'OUTCOME', '2021-05-26', '2021-05-26 21:00:08', '2021-05-26 20:59:59', NULL),
	(143, 'Żarcie owoce i warzywa', 111.51, 17, 7, 'OUTCOME', '2021-05-26', '2021-05-26 21:00:08', '2021-05-26 21:02:02', NULL),
	(144, 'Poduchy ziemia', 56.94, 3, 7, 'OUTCOME', '2021-05-26', '2021-05-28 16:12:26', '2021-05-28 16:10:58', NULL),
	(145, 'Dorsz', 18.66, 17, 7, 'OUTCOME', '2021-05-26', '2021-05-26 21:00:08', '2021-05-28 16:10:58', NULL),
	(146, 'Poduchy', 53.95, 3, 7, 'OUTCOME', '2021-05-27', '2021-05-28 16:14:12', '2021-05-28 18:14:11', NULL),
	(147, 'Baseus i kabel', 58.90, 3, 1, 'OUTCOME', '2021-04-14', '2021-05-28 16:18:55', '2021-05-28 18:18:54', NULL),
	(152, 'SKM', 7.60, 14, 19, 'OUTCOME', '2021-05-29', '2021-05-29 15:57:53', '2021-05-29 17:57:38', NULL),
	(153, 'Biedro zakupy jedzenie', 84.51, 8, 7, 'OUTCOME', '2021-05-29', '2021-05-29 17:30:45', '2021-05-29 17:59:41', NULL),
	(154, 'Rzeczy na tarte, foremka', 76.31, 8, 9, 'OUTCOME', '2021-05-29', '2021-05-29 15:57:53', '2021-05-29 17:30:32', NULL);
/*!40000 ALTER TABLE `transfer` ENABLE KEYS */;

-- Zrzut struktury wyzwalacz coinage-db.disallow_self_ref_before_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `disallow_self_ref_before_insert` BEFORE INSERT ON `category` FOR EACH ROW BEGIN
	IF (NEW.id = NEW.parent) THEN
		SIGNAL SQLSTATE '45000' set message_text = 'Record cannot contain self reference.';
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Zrzut struktury wyzwalacz coinage-db.disallow_self_ref_before_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `disallow_self_ref_before_update` BEFORE UPDATE ON `category` FOR EACH ROW BEGIN
	IF (NEW.id = NEW.parent) THEN
		SIGNAL SQLSTATE '45000' set message_text = 'Record cannot contain self reference.';
	END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
