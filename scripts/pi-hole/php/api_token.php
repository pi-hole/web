<?php
require 'auth.php';
require 'password.php';
check_cors();
?>

<html>
<head>
<style>
body {
    background: #fff;
    margin: 10px 0;
}

.qrcode {
    text-align: center;
    margin: 0 0 1em;
}

.qrcode svg {
    max-width: 100%;
    height: auto;
}

.token {
    font-size: 14px;
    word-break: break-word;
}
</style>
</head>
<body>
<?php
if ($auth) {
    if (strlen($pwhash) > 0) {
        echo '<div class="qrcode">';
        require_once '../../vendor/qrcode.php';
        $qr = QRCode::getMinimumQRCode($pwhash, QR_ERROR_CORRECT_LEVEL_Q);
        // The size of each block (in pixels) should be an integer
        $qr->printSVG(10);
        echo '</div>';
        echo 'Raw API Token: <code class="token">'.$pwhash.'</code></div>';
    } else {
        echo '<p>No password set</p>';
    }
} else {
    echo '<p>Not authorized!</p>';
}
?>
</body>
</html>
