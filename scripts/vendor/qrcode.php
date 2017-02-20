<?php

//---------------------------------------------------------------
// QRCode for PHP5
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

//---------------------------------------------------------------
// QRCode
//---------------------------------------------------------------

define("QR_PAD0", 0xEC);
define("QR_PAD1", 0x11);

class QRCode {

    var $typeNumber;

    var $modules;

    var $moduleCount;

    var $errorCorrectLevel;

    var $qrDataList;

    function QRCode() {
        $this->typeNumber = 1;
        $this->errorCorrectLevel = QR_ERROR_CORRECT_LEVEL_H;
        $this->qrDataList = array();
    }

    function getTypeNumber() {
        return $this->typeNumber;
    }

    function setTypeNumber($typeNumber) {
        $this->typeNumber = $typeNumber;
    }

    function getErrorCorrectLevel() {
        return $this->errorCorrectLevel;
    }

    function setErrorCorrectLevel($errorCorrectLevel) {
        $this->errorCorrectLevel = $errorCorrectLevel;
    }

    function addData($data, $mode = 0) {

        if ($mode == 0) {
            $mode = QRUtil::getMode($data);
        }

        switch($mode) {

        case QR_MODE_NUMBER :
            $this->addDataImpl(new QRNumber($data) );
            break;

        case QR_MODE_ALPHA_NUM :
            $this->addDataImpl(new QRAlphaNum($data) );
            break;

        case QR_MODE_8BIT_BYTE :
            $this->addDataImpl(new QR8BitByte($data) );
            break;

        case QR_MODE_KANJI :
            $this->addDataImpl(new QRKanji($data) );
            break;

        default :
            trigger_error("mode:$mode", E_USER_ERROR);
        }
    }

    function clearData() {
        $qrDataList = array();
    }

    function addDataImpl(&$qrData) {
        $this->qrDataList[] = $qrData;
    }

    function getDataCount() {
        return count($this->qrDataList);
    }

    function getData($index) {
        return $this->qrDataList[$index];
    }

    function isDark($row, $col) {
        if ($this->modules[$row][$col] !== null) {
            return $this->modules[$row][$col];
        } else {
            return false;
        }
    }

    function getModuleCount() {
        return $this->moduleCount;
    }

    // used for converting fg/bg colors (e.g. #0000ff = 0x0000FF)
    // added 2015.07.27 ~ DoktorJ
    function hex2rgb($hex = 0x0) {
        return array(
            'r' => floor($hex / 65536),
            'g' => floor($hex / 256) % 256,
            'b' => $hex % 256
        );
    }

    function make() {
        $this->makeImpl(false, $this->getBestMaskPattern() );
    }

    function getBestMaskPattern() {

        $minLostPoint = 0;
        $pattern = 0;

        for ($i = 0; $i < 8; $i++) {

            $this->makeImpl(true, $i);

            $lostPoint = QRUtil::getLostPoint($this);

            if ($i == 0 || $minLostPoint > $lostPoint) {
                $minLostPoint = $lostPoint;
                $pattern = $i;
            }
        }

        return $pattern;
    }

    function createNullArray($length) {
        $nullArray = array();
        for ($i = 0; $i < $length; $i++) {
            $nullArray[] = null;
        }
        return $nullArray;
    }

    function makeImpl($test, $maskPattern) {

        $this->moduleCount = $this->typeNumber * 4 + 17;

        $this->modules = array();
        for ($i = 0; $i < $this->moduleCount; $i++) {
            $this->modules[] = QRCode::createNullArray($this->moduleCount);
        }

        $this->setupPositionProbePattern(0, 0);
        $this->setupPositionProbePattern($this->moduleCount - 7, 0);
        $this->setupPositionProbePattern(0, $this->moduleCount - 7);

        $this->setupPositionAdjustPattern();
        $this->setupTimingPattern();

        $this->setupTypeInfo($test, $maskPattern);

        if ($this->typeNumber >= 7) {
            $this->setupTypeNumber($test);
        }

        $dataArray = $this->qrDataList;

        $data = QRCode::createData($this->typeNumber, $this->errorCorrectLevel, $dataArray);

        $this->mapData($data, $maskPattern);
    }

    function mapData(&$data, $maskPattern) {

        $inc = -1;
        $row = $this->moduleCount - 1;
        $bitIndex = 7;
        $byteIndex = 0;

        for ($col = $this->moduleCount - 1; $col > 0; $col -= 2) {

            if ($col == 6) $col--;

            while (true) {

                for ($c = 0; $c < 2; $c++) {

                    if ($this->modules[$row][$col - $c] === null) {

                        $dark = false;

                        if ($byteIndex < count($data) ) {
                            $dark = ( ( ($data[$byteIndex] >> $bitIndex) & 1) == 1);
                        }

                        $mask = QRUtil::getMask($maskPattern, $row, $col - $c);

                        if ($mask) {
                            $dark = !$dark;
                        }

                        $this->modules[$row][$col - $c] = $dark;
                        $bitIndex--;

                        if ($bitIndex == -1) {
                            $byteIndex++;
                            $bitIndex = 7;
                        }
                    }
                }

                $row += $inc;

                if ($row < 0 || $this->moduleCount <= $row) {
                    $row -= $inc;
                    $inc = -$inc;
                    break;
                }
            }
        }
    }

    function setupPositionAdjustPattern() {

        $pos = QRUtil::getPatternPosition($this->typeNumber);

        for ($i = 0; $i < count($pos); $i++) {

            for ($j = 0; $j < count($pos); $j++) {

                $row = $pos[$i];
                $col = $pos[$j];

                if ($this->modules[$row][$col] !== null) {
                    continue;
                }

                for ($r = -2; $r <= 2; $r++) {

                    for ($c = -2; $c <= 2; $c++) {

                        if ($r == -2 || $r == 2 || $c == -2 || $c == 2
                                || ($r == 0 && $c == 0) ) {
                            $this->modules[$row + $r][$col + $c] = true;
                        } else {
                            $this->modules[$row + $r][$col + $c] = false;
                        }
                    }
                }
            }
        }
    }

    function setupPositionProbePattern($row, $col) {

        for ($r = -1; $r <= 7; $r++) {

            for ($c = -1; $c <= 7; $c++) {

                if ($row + $r <= -1 || $this->moduleCount <= $row + $r
                        || $col + $c <= -1 || $this->moduleCount <= $col + $c) {
                    continue;
                }

                if ( (0 <= $r && $r <= 6 && ($c == 0 || $c == 6) )
                        || (0 <= $c && $c <= 6 && ($r == 0 || $r == 6) )
                        || (2 <= $r && $r <= 4 && 2 <= $c && $c <= 4) ) {
                    $this->modules[$row + $r][$col + $c] = true;
                } else {
                    $this->modules[$row + $r][$col + $c] = false;
                }
            }
        }
    }

    function setupTimingPattern() {

        for ($r = 8; $r < $this->moduleCount - 8; $r++) {
            if ($this->modules[$r][6] !== null) {
                continue;
            }
            $this->modules[$r][6] = ($r % 2 == 0);
        }

        for ($c = 8; $c < $this->moduleCount - 8; $c++) {
            if ($this->modules[6][$c] !== null) {
                continue;
            }
            $this->modules[6][$c] = ($c % 2 == 0);
        }
    }

    function setupTypeNumber($test) {

        $bits = QRUtil::getBCHTypeNumber($this->typeNumber);

        for ($i = 0; $i < 18; $i++) {
            $mod = (!$test && ( ($bits >> $i) & 1) == 1);
            $this->modules[floor($i / 3)][$i % 3 + $this->moduleCount - 8 - 3] = $mod;
        }

        for ($i = 0; $i < 18; $i++) {
            $mod = (!$test && ( ($bits >> $i) & 1) == 1);
            $this->modules[$i % 3 + $this->moduleCount - 8 - 3][floor($i / 3)] = $mod;
        }
    }

    function setupTypeInfo($test, $maskPattern) {

        $data = ($this->errorCorrectLevel << 3) | $maskPattern;
        $bits = QRUtil::getBCHTypeInfo($data);

        for ($i = 0; $i < 15; $i++) {

            $mod = (!$test && ( ($bits >> $i) & 1) == 1);

            if ($i < 6) {
                $this->modules[$i][8] = $mod;
            } else if ($i < 8) {
                $this->modules[$i + 1][8] = $mod;
            } else {
                $this->modules[$this->moduleCount - 15 + $i][8] = $mod;
            }
        }

        for ($i = 0; $i < 15; $i++) {

            $mod = (!$test && ( ($bits >> $i) & 1) == 1);

            if ($i < 8) {
                $this->modules[8][$this->moduleCount - $i - 1] = $mod;
            } else if ($i < 9) {
                $this->modules[8][15 - $i - 1 + 1] = $mod;
            } else {
                $this->modules[8][15 - $i - 1] = $mod;
            }
        }

        $this->modules[$this->moduleCount - 8][8] = !$test;
    }

    function createData($typeNumber, $errorCorrectLevel, $dataArray) {

        $rsBlocks = QRRSBlock::getRSBlocks($typeNumber, $errorCorrectLevel);

        $buffer = new QRBitBuffer();

        for ($i = 0; $i < count($dataArray); $i++) {
            $data = $dataArray[$i];
            $buffer->put($data->getMode(), 4);
            $buffer->put($data->getLength(), $data->getLengthInBits($typeNumber) );
            $data->write($buffer);
        }

        $totalDataCount = 0;
        for ($i = 0; $i < count($rsBlocks); $i++) {
            $totalDataCount += $rsBlocks[$i]->getDataCount();
        }

        if ($buffer->getLengthInBits() > $totalDataCount * 8) {
            trigger_error("code length overflow. ("
                . $buffer->getLengthInBits()
                . ">"
                .  $totalDataCount * 8
                . ")", E_USER_ERROR);
        }

        // end code.
        if ($buffer->getLengthInBits() + 4 <= $totalDataCount * 8) {
            $buffer->put(0, 4);
        }

        // padding
        while ($buffer->getLengthInBits() % 8 != 0) {
            $buffer->putBit(false);
        }

        // padding
        while (true) {

            if ($buffer->getLengthInBits() >= $totalDataCount * 8) {
                break;
            }
            $buffer->put(QR_PAD0, 8);

            if ($buffer->getLengthInBits() >= $totalDataCount * 8) {
                break;
            }
            $buffer->put(QR_PAD1, 8);
        }

        return QRCode::createBytes($buffer, $rsBlocks);
    }

    function createBytes(&$buffer, &$rsBlocks) {

        $offset = 0;

        $maxDcCount = 0;
        $maxEcCount = 0;

        $dcdata = QRCode::createNullArray(count($rsBlocks) );
        $ecdata = QRCode::createNullArray(count($rsBlocks) );

        for ($r = 0; $r < count($rsBlocks); $r++) {

            $dcCount = $rsBlocks[$r]->getDataCount();
            $ecCount = $rsBlocks[$r]->getTotalCount() - $dcCount;

            $maxDcCount = max($maxDcCount, $dcCount);
            $maxEcCount = max($maxEcCount, $ecCount);

            $dcdata[$r] = QRCode::createNullArray($dcCount);
            for ($i = 0; $i < count($dcdata[$r]); $i++) {
                $bdata = $buffer->getBuffer();
                $dcdata[$r][$i] = 0xff & $bdata[$i + $offset];
            }
            $offset += $dcCount;

            $rsPoly = QRUtil::getErrorCorrectPolynomial($ecCount);
            $rawPoly = new QRPolynomial($dcdata[$r], $rsPoly->getLength() - 1);

            $modPoly = $rawPoly->mod($rsPoly);
            $ecdata[$r] = QRCode::createNullArray($rsPoly->getLength() - 1);
            for ($i = 0; $i < count($ecdata[$r]); $i++) {
                $modIndex = $i + $modPoly->getLength() - count($ecdata[$r]);
                $ecdata[$r][$i] = ($modIndex >= 0)? $modPoly->get($modIndex) : 0;
            }
        }

        $totalCodeCount = 0;
        for ($i = 0; $i < count($rsBlocks); $i++) {
            $totalCodeCount += $rsBlocks[$i]->getTotalCount();
        }

        $data = QRCode::createNullArray($totalCodeCount);

        $index = 0;

        for ($i = 0; $i < $maxDcCount; $i++) {
            for ($r = 0; $r < count($rsBlocks); $r++) {
                if ($i < count($dcdata[$r]) ) {
                    $data[$index++] = $dcdata[$r][$i];
                }
            }
        }

        for ($i = 0; $i < $maxEcCount; $i++) {
            for ($r = 0; $r < count($rsBlocks); $r++) {
                if ($i < count($ecdata[$r]) ) {
                    $data[$index++] = $ecdata[$r][$i];
                }
            }
        }

        return $data;
    }

    static function getMinimumQRCode($data, $errorCorrectLevel) {

        $mode = QRUtil::getMode($data);

        $qr = new QRCode();
        $qr->setErrorCorrectLevel($errorCorrectLevel);
        $qr->addData($data, $mode);

        $qrData = $qr->getData(0);
        $length = $qrData->getLength();

        for ($typeNumber = 1; $typeNumber <= 10; $typeNumber++) {
            if ($length <= QRUtil::getMaxLength($typeNumber, $mode, $errorCorrectLevel) ) {
                $qr->setTypeNumber($typeNumber);
                break;
            }
        }

        $qr->make();

        return $qr;
    }

    // added $fg (foreground), $bg (background), and $bgtrans (use transparent bg) parameters
    // also added some simple error checking on parameters
    // updated 2015.07.27 ~ DoktorJ
    function createImage($size = 2, $margin = 2, $fg = 0x000000, $bg = 0xFFFFFF, $bgtrans = false) {

        // size/margin EC
        if (!is_numeric($size)) $size = 2;
        if (!is_numeric($margin)) $margin = 2;
        if ($size < 1) $size = 1;
        if ($margin < 0) $margin = 0;

        $image_size = $this->getModuleCount() * $size + $margin * 2;

        $image = imagecreatetruecolor($image_size, $image_size);

        // fg/bg EC
        if ($fg < 0 || $fg > 0xFFFFFF) $fg = 0x0;
        if ($bg < 0 || $bg > 0xFFFFFF) $bg = 0xFFFFFF;

        // convert hexadecimal RGB to arrays for imagecolorallocate
        $fgrgb = $this->hex2rgb($fg);
        $bgrgb = $this->hex2rgb($bg);

        // replace $black and $white with $fgc and $bgc
        $fgc = imagecolorallocate($image, $fgrgb['r'], $fgrgb['g'], $fgrgb['b']);
        $bgc = imagecolorallocate($image, $bgrgb['r'], $bgrgb['g'], $bgrgb['b']);
        if ($bgtrans) imagecolortransparent($image, $bgc);

        // update $white to $bgc
        imagefilledrectangle($image, 0, 0, $image_size, $image_size, $bgc);

        for ($r = 0; $r < $this->getModuleCount(); $r++) {
            for ($c = 0; $c < $this->getModuleCount(); $c++) {
                if ($this->isDark($r, $c) ) {

                    // update $black to $fgc
                    imagefilledrectangle($image,
                        $margin + $c * $size,
                        $margin + $r * $size,
                        $margin + ($c + 1) * $size - 1,
                        $margin + ($r + 1) * $size - 1,
                        $fgc);
                }
            }
        }

        return $image;
    }

    function printHTML($size = "2px") {

        $style = "border-style:none;border-collapse:collapse;margin:0px;padding:0px;";

        print("<table style='$style'>");

        for ($r = 0; $r < $this->getModuleCount(); $r++) {

            print("<tr style='$style'>");

            for ($c = 0; $c < $this->getModuleCount(); $c++) {
                $color = $this->isDark($r, $c)? "#000000" : "#ffffff";
                print("<td style='$style;width:$size;height:$size;background-color:$color'></td>");
            }

            print("</tr>");
        }

        print("</table>");
    }
}

//---------------------------------------------------------------
// QRUtil
//---------------------------------------------------------------

define("QR_G15", (1 << 10) | (1 << 8) | (1 << 5)
    | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0) );

define("QR_G18", (1 << 12) | (1 << 11) | (1 << 10)
    | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0) );

define("QR_G15_MASK", (1 << 14) | (1 << 12) | (1 << 10)
    | (1 << 4) | (1 << 1) );

class QRUtil {

	static $QR_MAX_LENGTH = array(
		array( array(41,  25,  17,  10),  array(34,  20,  14,  8),   array(27,  16,  11,  7),  array(17,  10,  7,   4) ),
		array( array(77,  47,  32,  20),  array(63,  38,  26,  16),  array(48,  29,  20,  12), array(34,  20,  14,  8) ),
		array( array(127, 77,  53,  32),  array(101, 61,  42,  26),  array(77,  47,  32,  20), array(58,  35,  24,  15) ),
		array( array(187, 114, 78,  48),  array(149, 90,  62,  38),  array(111, 67,  46,  28), array(82,  50,  34,  21) ),
		array( array(255, 154, 106, 65),  array(202, 122, 84,  52),  array(144, 87,  60,  37), array(106, 64,  44,  27) ),
		array( array(322, 195, 134, 82),  array(255, 154, 106, 65),  array(178, 108, 74,  45), array(139, 84,  58,  36) ),
		array( array(370, 224, 154, 95),  array(293, 178, 122, 75),  array(207, 125, 86,  53), array(154, 93,  64,  39) ),
		array( array(461, 279, 192, 118), array(365, 221, 152, 93),  array(259, 157, 108, 66), array(202, 122, 84,  52) ),
		array( array(552, 335, 230, 141), array(432, 262, 180, 111), array(312, 189, 130, 80), array(235, 143, 98,  60) ),
		array( array(652, 395, 271, 167), array(513, 311, 213, 131), array(364, 221, 151, 93), array(288, 174, 119, 74) )
	);

	static $QR_PATTERN_POSITION_TABLE = array(
		array(),
		array(6, 18),
		array(6, 22),
		array(6, 26),
		array(6, 30),
		array(6, 34),
		array(6, 22, 38),
		array(6, 24, 42),
		array(6, 26, 46),
		array(6, 28, 50),
		array(6, 30, 54),
		array(6, 32, 58),
		array(6, 34, 62),
		array(6, 26, 46, 66),
		array(6, 26, 48, 70),
		array(6, 26, 50, 74),
		array(6, 30, 54, 78),
		array(6, 30, 56, 82),
		array(6, 30, 58, 86),
		array(6, 34, 62, 90),
		array(6, 28, 50, 72, 94),
		array(6, 26, 50, 74, 98),
		array(6, 30, 54, 78, 102),
		array(6, 28, 54, 80, 106),
		array(6, 32, 58, 84, 110),
		array(6, 30, 58, 86, 114),
		array(6, 34, 62, 90, 118),
		array(6, 26, 50, 74, 98, 122),
		array(6, 30, 54, 78, 102, 126),
		array(6, 26, 52, 78, 104, 130),
		array(6, 30, 56, 82, 108, 134),
		array(6, 34, 60, 86, 112, 138),
		array(6, 30, 58, 86, 114, 142),
		array(6, 34, 62, 90, 118, 146),
		array(6, 30, 54, 78, 102, 126, 150),
		array(6, 24, 50, 76, 102, 128, 154),
		array(6, 28, 54, 80, 106, 132, 158),
		array(6, 32, 58, 84, 110, 136, 162),
		array(6, 26, 54, 82, 110, 138, 166),
		array(6, 30, 58, 86, 114, 142, 170)
	);

    static function getPatternPosition($typeNumber) {
        return self::$QR_PATTERN_POSITION_TABLE[$typeNumber - 1];
    }

    static function getMaxLength($typeNumber, $mode, $errorCorrectLevel) {

        $t = $typeNumber - 1;
        $e = 0;
        $m = 0;

        switch($errorCorrectLevel) {
        case QR_ERROR_CORRECT_LEVEL_L : $e = 0; break;
        case QR_ERROR_CORRECT_LEVEL_M : $e = 1; break;
        case QR_ERROR_CORRECT_LEVEL_Q : $e = 2; break;
        case QR_ERROR_CORRECT_LEVEL_H : $e = 3; break;
        default :
            trigger_error("e:$errorCorrectLevel", E_USER_ERROR);
        }

        switch($mode) {
        case QR_MODE_NUMBER    : $m = 0; break;
        case QR_MODE_ALPHA_NUM : $m = 1; break;
        case QR_MODE_8BIT_BYTE : $m = 2; break;
        case QR_MODE_KANJI     : $m = 3; break;
        default :
            trigger_error("m:$mode", E_USER_ERROR);
        }

        return self::$QR_MAX_LENGTH[$t][$e][$m];
    }

    static function getErrorCorrectPolynomial($errorCorrectLength) {

        $a = new QRPolynomial(array(1) );

        for ($i = 0; $i < $errorCorrectLength; $i++) {
            $a = $a->multiply(new QRPolynomial(array(1, QRMath::gexp($i) ) ) );
        }

        return $a;
    }

    static function getMask($maskPattern, $i, $j) {

        switch ($maskPattern) {

        case QR_MASK_PATTERN000 : return ($i + $j) % 2 == 0;
        case QR_MASK_PATTERN001 : return $i % 2 == 0;
        case QR_MASK_PATTERN010 : return $j % 3 == 0;
        case QR_MASK_PATTERN011 : return ($i + $j) % 3 == 0;
        case QR_MASK_PATTERN100 : return (floor($i / 2) + floor($j / 3) ) % 2 == 0;
        case QR_MASK_PATTERN101 : return ($i * $j) % 2 + ($i * $j) % 3 == 0;
        case QR_MASK_PATTERN110 : return ( ($i * $j) % 2 + ($i * $j) % 3) % 2 == 0;
        case QR_MASK_PATTERN111 : return ( ($i * $j) % 3 + ($i + $j) % 2) % 2 == 0;

        default :
            trigger_error("mask:$maskPattern", E_USER_ERROR);
        }
    }

    static function getLostPoint($qrCode) {

        $moduleCount = $qrCode->getModuleCount();

        $lostPoint = 0;


        // LEVEL1

        for ($row = 0; $row < $moduleCount; $row++) {

            for ($col = 0; $col < $moduleCount; $col++) {

                $sameCount = 0;
                $dark = $qrCode->isDark($row, $col);

                for ($r = -1; $r <= 1; $r++) {

                    if ($row + $r < 0 || $moduleCount <= $row + $r) {
                        continue;
                    }

                    for ($c = -1; $c <= 1; $c++) {

                        if ($col + $c < 0 || $moduleCount <= $col + $c) {
                            continue;
                        }

                        if ($r == 0 && $c == 0) {
                            continue;
                        }

                        if ($dark == $qrCode->isDark($row + $r, $col + $c) ) {
                            $sameCount++;
                        }
                    }
                }

                if ($sameCount > 5) {
                    $lostPoint += (3 + $sameCount - 5);
                }
            }
        }

        // LEVEL2

        for ($row = 0; $row < $moduleCount - 1; $row++) {
            for ($col = 0; $col < $moduleCount - 1; $col++) {
                $count = 0;
                if ($qrCode->isDark($row,     $col    ) ) $count++;
                if ($qrCode->isDark($row + 1, $col    ) ) $count++;
                if ($qrCode->isDark($row,     $col + 1) ) $count++;
                if ($qrCode->isDark($row + 1, $col + 1) ) $count++;
                if ($count == 0 || $count == 4) {
                    $lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for ($row = 0; $row < $moduleCount; $row++) {
            for ($col = 0; $col < $moduleCount - 6; $col++) {
                if ($qrCode->isDark($row, $col)
                        && !$qrCode->isDark($row, $col + 1)
                        &&  $qrCode->isDark($row, $col + 2)
                        &&  $qrCode->isDark($row, $col + 3)
                        &&  $qrCode->isDark($row, $col + 4)
                        && !$qrCode->isDark($row, $col + 5)
                        &&  $qrCode->isDark($row, $col + 6) ) {
                    $lostPoint += 40;
                }
            }
        }

        for ($col = 0; $col < $moduleCount; $col++) {
            for ($row = 0; $row < $moduleCount - 6; $row++) {
                if ($qrCode->isDark($row, $col)
                        && !$qrCode->isDark($row + 1, $col)
                        &&  $qrCode->isDark($row + 2, $col)
                        &&  $qrCode->isDark($row + 3, $col)
                        &&  $qrCode->isDark($row + 4, $col)
                        && !$qrCode->isDark($row + 5, $col)
                        &&  $qrCode->isDark($row + 6, $col) ) {
                    $lostPoint += 40;
                }
            }
        }

        // LEVEL4

        $darkCount = 0;

        for ($col = 0; $col < $moduleCount; $col++) {
            for ($row = 0; $row < $moduleCount; $row++) {
                if ($qrCode->isDark($row, $col) ) {
                    $darkCount++;
                }
            }
        }

        $ratio = abs(100 * $darkCount / $moduleCount / $moduleCount - 50) / 5;
        $lostPoint += $ratio * 10;

        return $lostPoint;
    }

    static function getMode($s) {
        if (QRUtil::isAlphaNum($s) ) {
            if (QRUtil::isNumber($s) ) {
                return QR_MODE_NUMBER;
            }
            return QR_MODE_ALPHA_NUM;
        } else if (QRUtil::isKanji($s) ) {
            return QR_MODE_KANJI;
        } else {
            return QR_MODE_8BIT_BYTE;
        }
    }

    static function isNumber($s) {
        for ($i = 0; $i < strlen($s); $i++) {
            $c = ord($s[$i]);
            if (!(QRUtil::toCharCode('0') <= $c && $c <= QRUtil::toCharCode('9') ) ) {
                return false;
            }
        }
        return true;
    }

    static function isAlphaNum($s) {
        for ($i = 0; $i < strlen($s); $i++) {
            $c = ord($s[$i]);
            if (!(QRUtil::toCharCode('0') <= $c && $c <= QRUtil::toCharCode('9') )
                && !(QRUtil::toCharCode('A') <= $c && $c <= QRUtil::toCharCode('Z') )
                    && strpos(" $%*+-./:", $s[$i]) === false) {
                return false;
            }
        }
        return true;
    }

    static function isKanji($s) {

        $data = $s;

        $i = 0;

        while ($i + 1 < strlen($data) ) {

            $c = ( (0xff & ord($data[$i]) ) << 8) | (0xff & ord($data[$i + 1]) );

            if (!(0x8140 <= $c && $c <= 0x9FFC) && !(0xE040 <= $c && $c <= 0xEBBF) ) {
                return false;
            }

            $i += 2;
        }

        if ($i < strlen($data) ) {
            return false;
        }

        return true;
    }

    static function toCharCode($s) {
        return ord($s[0]);
    }

    static function getBCHTypeInfo($data) {
        $d = $data << 10;
        while (QRUtil::getBCHDigit($d) - QRUtil::getBCHDigit(QR_G15) >= 0) {
            $d ^= (QR_G15 << (QRUtil::getBCHDigit($d) - QRUtil::getBCHDigit(QR_G15) ) );
        }
        return ( ($data << 10) | $d) ^ QR_G15_MASK;
    }

    static function getBCHTypeNumber($data) {
        $d = $data << 12;
        while (QRUtil::getBCHDigit($d) - QRUtil::getBCHDigit(QR_G18) >= 0) {
            $d ^= (QR_G18 << (QRUtil::getBCHDigit($d) - QRUtil::getBCHDigit(QR_G18) ) );
        }
        return ($data << 12) | $d;
    }

    static function getBCHDigit($data) {

        $digit = 0;

        while ($data != 0) {
            $digit++;
            $data >>= 1;
        }

        return $digit;
    }
}

//---------------------------------------------------------------
// QRRSBlock
//---------------------------------------------------------------

class QRRSBlock {

    var $totalCount;
    var $dataCount;

	static $QR_RS_BLOCK_TABLE = array(

		// L
		// M
		// Q
		// H

		// 1
		array(1, 26, 19),
		array(1, 26, 16),
		array(1, 26, 13),
		array(1, 26, 9),

		// 2
		array(1, 44, 34),
		array(1, 44, 28),
		array(1, 44, 22),
		array(1, 44, 16),

		// 3
		array(1, 70, 55),
		array(1, 70, 44),
		array(2, 35, 17),
		array(2, 35, 13),

		// 4
		array(1, 100, 80),
		array(2, 50, 32),
		array(2, 50, 24),
		array(4, 25, 9),

		// 5
		array(1, 134, 108),
		array(2, 67, 43),
		array(2, 33, 15, 2, 34, 16),
		array(2, 33, 11, 2, 34, 12),

		// 6
		array(2, 86, 68),
		array(4, 43, 27),
		array(4, 43, 19),
		array(4, 43, 15),

		// 7
		array(2, 98, 78),
		array(4, 49, 31),
		array(2, 32, 14, 4, 33, 15),
		array(4, 39, 13, 1, 40, 14),

		// 8
		array(2, 121, 97),
		array(2, 60, 38, 2, 61, 39),
		array(4, 40, 18, 2, 41, 19),
		array(4, 40, 14, 2, 41, 15),

		// 9
		array(2, 146, 116),
		array(3, 58, 36, 2, 59, 37),
		array(4, 36, 16, 4, 37, 17),
		array(4, 36, 12, 4, 37, 13),

		// 10
		array(2, 86, 68, 2, 87, 69),
		array(4, 69, 43, 1, 70, 44),
		array(6, 43, 19, 2, 44, 20),
		array(6, 43, 15, 2, 44, 16)

	);

    function QRRSBlock($totalCount, $dataCount) {
        $this->totalCount = $totalCount;
        $this->dataCount  = $dataCount;
    }

    function getDataCount() {
        return $this->dataCount;
    }

    function getTotalCount() {
        return $this->totalCount;
    }

    static function getRSBlocks($typeNumber, $errorCorrectLevel) {

        $rsBlock = QRRSBlock::getRsBlockTable($typeNumber, $errorCorrectLevel);
        $length = count($rsBlock) / 3;

        $list = array();

        for ($i = 0; $i < $length; $i++) {

            $count = $rsBlock[$i * 3 + 0];
            $totalCount = $rsBlock[$i * 3 + 1];
            $dataCount  = $rsBlock[$i * 3 + 2];

            for ($j = 0; $j < $count; $j++) {
                $list[] = new QRRSBlock($totalCount, $dataCount);
            }
        }

        return $list;
    }

    static function getRsBlockTable($typeNumber, $errorCorrectLevel) {

        switch($errorCorrectLevel) {
        case QR_ERROR_CORRECT_LEVEL_L :
            return self::$QR_RS_BLOCK_TABLE[($typeNumber - 1) * 4 + 0];
        case QR_ERROR_CORRECT_LEVEL_M :
            return self::$QR_RS_BLOCK_TABLE[($typeNumber - 1) * 4 + 1];
        case QR_ERROR_CORRECT_LEVEL_Q :
            return self::$QR_RS_BLOCK_TABLE[($typeNumber - 1) * 4 + 2];
        case QR_ERROR_CORRECT_LEVEL_H :
            return self::$QR_RS_BLOCK_TABLE[($typeNumber - 1) * 4 + 3];
        default :
            trigger_error("tn:$typeNumber/ecl:$errorCorrectLevel", E_USER_ERROR);
        }
    }
}

//---------------------------------------------------------------
// QRNumber
//---------------------------------------------------------------

class QRNumber extends QRData {

    function QRNumber($data) {
        QRData::QRData(QR_MODE_NUMBER, $data);
    }

    function write(&$buffer) {

        $data = $this->getData();

        $i = 0;

        while ($i + 2 < strlen($data) ) {
            $num = QRNumber::parseInt(substr($data, $i, 3) );
            $buffer->put($num, 10);
            $i += 3;
        }

        if ($i < strlen($data) ) {

            if (strlen($data) - $i == 1) {
                $num = QRNumber::parseInt(substr($data, $i, $i + 1) );
                $buffer->put($num, 4);
            } else if (strlen($data) - $i == 2) {
                $num = QRNumber::parseInt(substr($data, $i, $i + 2) );
                $buffer->put($num, 7);
            }
        }
    }

    function getLength() {
        return strlen($this->getData() );
    }

    static function parseInt($s) {

        $num = 0;
        for ($i = 0; $i < strlen($s); $i++) {
            $num = $num * 10 + QRNumber::parseIntAt(ord($s[$i]) );
        }
        return $num;
    }

    static function parseIntAt($c) {

        if (QRUtil::toCharCode('0') <= $c && $c <= QRUtil::toCharCode('9') ) {
            return $c - QRUtil::toCharCode('0');
        }

        trigger_error("illegal char : $c", E_USER_ERROR);
    }
}

//---------------------------------------------------------------
// QRKanji
//---------------------------------------------------------------

class QRKanji extends QRData {

    function QRKanji($data) {
        QRData::QRData(QR_MODE_KANJI, $data);
    }

    function write(&$buffer) {

        $data = $this->getData();

        $i = 0;

        while ($i + 1 < strlen($data) ) {

            $c = ( (0xff & ord($data[$i]) ) << 8) | (0xff & ord($data[$i + 1]) );

            if (0x8140 <= $c && $c <= 0x9FFC) {
                $c -= 0x8140;
            } else if (0xE040 <= $c && $c <= 0xEBBF) {
                $c -= 0xC140;
            } else {
                trigger_error("illegal char at " . ($i + 1) . "/$c", E_USER_ERROR);
            }

            $c = ( ($c >> 8) & 0xff) * 0xC0 + ($c & 0xff);

            $buffer->put($c, 13);

            $i += 2;
        }

        if ($i < strlen($data) ) {
            trigger_error("illegal char at " . ($i + 1), E_USER_ERROR);
        }
    }

    function getLength() {
        return floor(strlen($this->getData() ) / 2);
    }
}

//---------------------------------------------------------------
// QRAlphaNum
//---------------------------------------------------------------

class QRAlphaNum extends QRData {

    function QRAlphaNum($data) {
        QRData::QRData(QR_MODE_ALPHA_NUM, $data);
    }

    function write(&$buffer) {

        $i = 0;
        $c = $this->getData();

        while ($i + 1 < strlen($c) ) {
            $buffer->put(QRAlphaNum::getCode(ord($c[$i]) ) * 45
                + QRAlphaNum::getCode(ord($c[$i + 1]) ), 11);
            $i += 2;
        }

        if ($i < strlen($c) ) {
            $buffer->put(QRAlphaNum::getCode(ord($c[$i])), 6);
        }
    }

    function getLength() {
        return strlen($this->getData() );
    }

    static function getCode($c) {

        if (QRUtil::toCharCode('0') <= $c
                && $c <= QRUtil::toCharCode('9') ) {
            return $c - QRUtil::toCharCode('0');
        } else if (QRUtil::toCharCode('A') <= $c
                && $c <= QRUtil::toCharCode('Z') ) {
            return $c - QRUtil::toCharCode('A') + 10;
        } else {
            switch ($c) {
            case QRUtil::toCharCode(' ') : return 36;
            case QRUtil::toCharCode('$') : return 37;
            case QRUtil::toCharCode('%') : return 38;
            case QRUtil::toCharCode('*') : return 39;
            case QRUtil::toCharCode('+') : return 40;
            case QRUtil::toCharCode('-') : return 41;
            case QRUtil::toCharCode('.') : return 42;
            case QRUtil::toCharCode('/') : return 43;
            case QRUtil::toCharCode(':') : return 44;
            default :
                trigger_error("illegal char : $c", E_USER_ERROR);
            }
        }

    }
}

//---------------------------------------------------------------
// QR8BitByte
//---------------------------------------------------------------

class QR8BitByte extends QRData {

    function QR8BitByte($data) {
        QRData::QRData(QR_MODE_8BIT_BYTE, $data);
    }

    function write(&$buffer) {

        $data = $this->getData();
        for ($i = 0; $i < strlen($data); $i++) {
            $buffer->put(ord($data[$i]), 8);
        }
    }

    function getLength() {
        return strlen($this->getData() );
    }
}

//---------------------------------------------------------------
// QRData
//---------------------------------------------------------------

class QRData {

    var $mode;

    var $data;

    function QRData($mode, $data) {
        $this->mode = $mode;
        $this->data = $data;
    }

    function getMode() {
        return $this->mode;
    }

    function getData() {
        return $this->data;
    }

    function getLength() {
        trigger_error("not implemented.", E_USER_ERROR);
    }

    function write(&$buffer) {
        trigger_error("not implemented.", E_USER_ERROR);
    }

    function getLengthInBits($type) {

        if (1 <= $type && $type < 10) {

            // 1 - 9

            switch($this->mode) {
            case QR_MODE_NUMBER     : return 10;
            case QR_MODE_ALPHA_NUM     : return 9;
            case QR_MODE_8BIT_BYTE    : return 8;
            case QR_MODE_KANJI      : return 8;
            default :
                trigger_error("mode:$this->mode", E_USER_ERROR);
            }

        } else if ($type < 27) {

            // 10 - 26

            switch($this->mode) {
            case QR_MODE_NUMBER     : return 12;
            case QR_MODE_ALPHA_NUM     : return 11;
            case QR_MODE_8BIT_BYTE    : return 16;
            case QR_MODE_KANJI      : return 10;
            default :
                trigger_error("mode:$this->mode", E_USER_ERROR);
            }

        } else if ($type < 41) {

            // 27 - 40

            switch($this->mode) {
            case QR_MODE_NUMBER     : return 14;
            case QR_MODE_ALPHA_NUM    : return 13;
            case QR_MODE_8BIT_BYTE    : return 16;
            case QR_MODE_KANJI      : return 12;
            default :
                trigger_error("mode:$this->mode", E_USER_ERROR);
            }

        } else {
            trigger_error("mode:$this->mode", E_USER_ERROR);
        }
    }

}

//---------------------------------------------------------------
// QRMath
//---------------------------------------------------------------

class QRMath {

	static $QR_MATH_EXP_TABLE = null;
	static $QR_MATH_LOG_TABLE = null;

    static function init() {

        self::$QR_MATH_EXP_TABLE = QRMath::createNumArray(256);

        for ($i = 0; $i < 8; $i++) {
            self::$QR_MATH_EXP_TABLE[$i] = 1 << $i;
        }

        for ($i = 8; $i < 256; $i++) {
            self::$QR_MATH_EXP_TABLE[$i] = self::$QR_MATH_EXP_TABLE[$i - 4]
                ^ self::$QR_MATH_EXP_TABLE[$i - 5]
                ^ self::$QR_MATH_EXP_TABLE[$i - 6]
                ^ self::$QR_MATH_EXP_TABLE[$i - 8];
        }

        self::$QR_MATH_LOG_TABLE = QRMath::createNumArray(256);

        for ($i = 0; $i < 255; $i++) {
            self::$QR_MATH_LOG_TABLE[self::$QR_MATH_EXP_TABLE[$i] ] = $i;
        }
    }

    static function createNumArray($length) {
        $num_array = array();
        for ($i = 0; $i < $length; $i++) {
            $num_array[] = 0;
        }
        return $num_array;
    }

    static function glog($n) {

        if ($n < 1) {
            trigger_error("log($n)", E_USER_ERROR);
        }

        return self::$QR_MATH_LOG_TABLE[$n];
    }

    static function gexp($n) {

        while ($n < 0) {
            $n += 255;
        }

        while ($n >= 256) {
            $n -= 255;
        }

        return self::$QR_MATH_EXP_TABLE[$n];
    }
}

// init static table
QRMath::init();

//---------------------------------------------------------------
// QRPolynomial
//---------------------------------------------------------------

class QRPolynomial {

    var $num;

    function QRPolynomial($num, $shift = 0) {

        $offset = 0;

        while ($offset < count($num) && $num[$offset] == 0) {
            $offset++;
        }

        $this->num = QRMath::createNumArray(count($num) - $offset + $shift);
        for ($i = 0; $i < count($num) - $offset; $i++) {
            $this->num[$i] = $num[$i + $offset];
        }
    }

    function get($index) {
        return $this->num[$index];
    }

    function getLength() {
        return count($this->num);
    }

    // PHP5
    function __toString() {
        return $this->toString();
    }

    function toString() {

        $buffer = "";

        for ($i = 0; $i < $this->getLength(); $i++) {
            if ($i > 0) {
                $buffer .= ",";
            }
            $buffer .= $this->get($i);
        }

        return $buffer;
    }

    function toLogString() {

        $buffer = "";

        for ($i = 0; $i < $this->getLength(); $i++) {
            if ($i > 0) {
                $buffer .= ",";
            }
            $buffer .= QRMath::glog($this->get(i) );
        }

        return $buffer;
    }

    function multiply($e) {

        $num = QRMath::createNumArray($this->getLength() + $e->getLength() - 1);

        for ($i = 0; $i < $this->getLength(); $i++) {
            for ($j = 0; $j < $e->getLength(); $j++) {
                $num[$i + $j] ^= QRMath::gexp(QRMath::glog($this->get($i) ) + QRMath::glog($e->get($j) ) );
            }
        }

        return new QRPolynomial($num);
    }

    function mod($e) {

        if ($this->getLength() - $e->getLength() < 0) {
            return $this;
        }

        $ratio = QRMath::glog($this->get(0) ) - QRMath::glog($e->get(0) );

        $num = QRMath::createNumArray($this->getLength() );
        for ($i = 0; $i < $this->getLength(); $i++) {
            $num[$i] = $this->get($i);
        }

        for ($i = 0; $i < $e->getLength(); $i++) {
            $num[$i] ^= QRMath::gexp(QRMath::glog($e->get($i) ) + $ratio);
        }

        $newPolynomial = new QRPolynomial($num);
        return $newPolynomial->mod($e);
    }
}

//---------------------------------------------------------------
// Mode
//---------------------------------------------------------------

define("QR_MODE_NUMBER", 1 << 0);
define("QR_MODE_ALPHA_NUM", 1 << 1);
define("QR_MODE_8BIT_BYTE", 1 << 2);
define("QR_MODE_KANJI", 1 << 3);

//---------------------------------------------------------------
// MaskPattern
//---------------------------------------------------------------

define("QR_MASK_PATTERN000", 0);
define("QR_MASK_PATTERN001", 1);
define("QR_MASK_PATTERN010", 2);
define("QR_MASK_PATTERN011", 3);
define("QR_MASK_PATTERN100", 4);
define("QR_MASK_PATTERN101", 5);
define("QR_MASK_PATTERN110", 6);
define("QR_MASK_PATTERN111", 7);

//---------------------------------------------------------------
// ErrorCorrectLevel

// 7%.
define("QR_ERROR_CORRECT_LEVEL_L", 1);
// 15%.
define("QR_ERROR_CORRECT_LEVEL_M", 0);
// 25%.
define("QR_ERROR_CORRECT_LEVEL_Q", 3);
// 30%.
define("QR_ERROR_CORRECT_LEVEL_H", 2);


//---------------------------------------------------------------
// QRBitBuffer
//---------------------------------------------------------------

class QRBitBuffer {

    var $buffer;
    var $length;

    function QRBitBuffer() {
        $this->buffer = array();
        $this->length = 0;
    }

    function getBuffer() {
        return $this->buffer;
    }

    function getLengthInBits() {
        return $this->length;
    }

    function __toString() {
        $buffer = "";
        for ($i = 0; $i < $this->getLengthInBits(); $i++) {
            $buffer .= $this->get($i)? '1' : '0';
        }
        return $buffer;
    }

    function get($index) {
        $bufIndex = floor($index / 8);
        return ( ($this->buffer[$bufIndex] >> (7 - $index % 8) ) & 1) == 1;
    }

    function put($num, $length) {

        for ($i = 0; $i < $length; $i++) {
            $this->putBit( ( ($num >> ($length - $i - 1) ) & 1) == 1);
        }
    }

    function putBit($bit) {

        $bufIndex = floor($this->length / 8);
        if (count($this->buffer) <= $bufIndex) {
            $this->buffer[] = 0;
        }

        if ($bit) {
            $this->buffer[$bufIndex] |= (0x80 >> ($this->length % 8) );
        }

        $this->length++;
    }
}

?>
