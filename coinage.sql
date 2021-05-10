-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Wersja serwera:               8.0.23 - MySQL Community Server - GPL
-- Serwer OS:                    Linux
-- HeidiSQL Wersja:              11.2.0.6213
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Zrzut struktury tabela coinage-db.category
CREATE TABLE IF NOT EXISTS `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `parent` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `FK_category_category` (`parent`),
  CONSTRAINT `FK_category_category` FOREIGN KEY (`parent`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.category: ~8 rows (około)
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
REPLACE INTO `category` (`id`, `name`, `description`, `parent`) VALUES
	(1, 'Paliwo', NULL, 2),
	(2, 'Samochód', 'Wydatki na samochów', NULL),
	(3, 'Mieszkanie', 'Łacznik ogólnych wydatków na mieszkania', NULL),
	(4, 'Wyszeckiego', 'Mieszkanie na Wyszeckiego', 3),
	(5, 'Rozrywka', NULL, NULL),
	(6, 'Gry', NULL, 5),
	(7, 'Prezent', NULL, NULL),
	(8, 'Jedzenie', NULL, NULL),
	(9, 'Kainos Income', NULL, NULL);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.contractor
CREATE TABLE IF NOT EXISTS `contractor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.contractor: ~8 rows (około)
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
	(10, 'Orlen');
/*!40000 ALTER TABLE `contractor` ENABLE KEYS */;

-- Zrzut struktury tabela coinage-db.income
CREATE TABLE IF NOT EXISTS `income` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.income: ~0 rows (około)
/*!40000 ALTER TABLE `income` DISABLE KEYS */;
/*!40000 ALTER TABLE `income` ENABLE KEYS */;

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
  PRIMARY KEY (`id`),
  KEY `FK_transfer_category` (`category`),
  KEY `FK_transfer_contractor` (`contractor`),
  CONSTRAINT `FK_transfer_category` FOREIGN KEY (`category`) REFERENCES `category` (`id`),
  CONSTRAINT `FK_transfer_contractor` FOREIGN KEY (`contractor`) REFERENCES `contractor` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Zrzucanie danych dla tabeli coinage-db.transfer: ~18 rows (około)
/*!40000 ALTER TABLE `transfer` DISABLE KEYS */;
REPLACE INTO `transfer` (`id`, `description`, `amount`, `category`, `contractor`, `type`, `date`, `edited_date`) VALUES
	(1, 'Roborock S6 MaxV', 2405.00, 3, 2, 'OUTCOME', '2021-03-23', '2021-05-01 17:49:05'),
	(2, 'Mieszkanie Kaucja', 1600.00, 4, 5, 'OUTCOME', '2021-04-10', '2021-05-01 17:49:06'),
	(3, 'Nintendo Switch + Dodatki', 1965.00, 5, 2, 'OUTCOME', '2020-12-20', '2021-05-01 17:49:04'),
	(4, 'Najem', 1600.00, 4, 5, 'OUTCOME', '2021-04-12', '2021-05-01 17:49:07'),
	(5, 'Materac piankowy Calio 160x200', 749.00, 3, 1, 'OUTCOME', '2021-04-12', '2021-05-01 17:52:11'),
	(6, 'Uniwersalna Srebrna Metalowa Półka', 117.90, 3, 1, 'OUTCOME', '2021-04-24', '2021-05-04 19:52:53'),
	(7, 'Fotele Hexagon x2', 298.00, 3, 6, 'OUTCOME', '2021-04-16', '2021-05-01 17:49:09'),
	(8, 'Dywanik 80x150', 135.00, 3, 1, 'OUTCOME', '2021-04-26', '2021-05-01 17:49:14'),
	(9, 'Bomba na Pchły', 73.98, 4, 1, 'OUTCOME', '2021-04-21', '2021-05-03 20:47:52'),
	(10, 'Dywanik 50x80', 53.99, 3, 1, 'OUTCOME', '2021-04-16', '2021-05-04 19:49:55'),
	(11, 'Najem', 1600.00, 4, 5, 'OUTCOME', '2021-05-07', '2021-05-07 00:36:00'),
	(12, 'Notariusz Umowa Egzekucja', 307.00, 4, NULL, 'OUTCOME', '2021-04-28', '2021-05-01 18:01:26'),
	(13, 'Folia Tunelowa 8x2', 43.20, 4, 1, 'OUTCOME', '2021-05-02', '2021-05-04 19:50:36'),
	(14, 'Farby Akr Zestaw', 48.99, 7, 1, 'OUTCOME', '2021-05-02', '2021-05-03 20:47:19'),
	(15, 'Farby Akr Zestaw XL', 166.77, 7, 1, 'OUTCOME', '2021-05-02', '2021-05-03 20:47:08'),
	(16, 'Kainos Income', 5199.54, 9, NULL, 'INCOME', '2021-04-08', '2021-05-04 19:51:15'),
	(17, 'Kainos Income', 5199.54, 9, NULL, 'INCOME', '2021-05-07', '2021-05-07 00:29:34'),
	(18, 'Paliwo', 139.21, 1, 10, 'OUTCOME', '2021-04-28', '2021-05-03 20:45:30'),
	(19, 'Bemi Cognita Ebook Reader', 294.99, 7, 1, 'OUTCOME', '2021-05-07', '2021-05-07 00:29:01'),
	(20, 'Zakupy', 104.18, 8, 9, 'OUTCOME', '2021-05-05', '2021-05-07 00:30:35'),
	(21, 'Zakupy', 77.87, 8, 7, 'OUTCOME', '2021-05-04', '2021-05-07 00:30:59'),
	(22, 'Notesy Lookah', 117.00, 7, NULL, 'OUTCOME', '2021-05-05', '2021-05-07 00:31:36'),
	(23, 'Pizza', 92.50, 8, NULL, 'OUTCOME', '2021-05-06', '2021-05-07 00:32:55'),
	(24, 'Zakupy', 154.16, 8, 7, 'OUTCOME', '2021-05-02', '2021-05-07 00:33:15'),
	(25, 'Zakupy', 55.77, 8, 7, 'OUTCOME', '2021-05-02', '2021-05-07 00:33:31'),
	(26, 'Zakupy', 148.50, 8, 7, 'OUTCOME', '2021-05-01', '2021-05-07 00:33:53');
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
