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

-- Zrzut struktury tabela coinage-db.account
CREATE TABLE IF NOT EXISTS `account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

-- Zrzut struktury tabela coinage-db.contractor
CREATE TABLE IF NOT EXISTS `contractor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

-- Zrzut struktury tabela coinage-db.income
CREATE TABLE IF NOT EXISTS `income` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

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
  `account_id` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_transfer_receipt` (`receipt`),
  KEY `FK_transfer_contractor` (`contractor`),
  KEY `FK_transfer_category` (`category`),
  KEY `FK_transfer_account` (`account_id`),
  CONSTRAINT `FK_transfer_account` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`),
  CONSTRAINT `FK_transfer_category` FOREIGN KEY (`category`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FK_transfer_contractor` FOREIGN KEY (`contractor`) REFERENCES `contractor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_transfer_receipt` FOREIGN KEY (`receipt`) REFERENCES `receipt` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=345 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Eksport danych został odznaczony.

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
