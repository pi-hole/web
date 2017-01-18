<?php

function message($code)
{
    switch ($code)
        {
            case 0:
            return 'No error';

            case 1:
            return 'Multi-disk zip archives not supported';

            case 2:
            return 'Renaming temporary file failed';

            case 3:
            return 'Closing zip archive failed';

            case 4:
            return 'Seek error';

            case 5:
            return 'Read error';

            case 6:
            return 'Write error';

            case 7:
            return 'CRC error';

            case 8:
            return 'Containing zip archive was closed';

            case 9:
            return 'No such file';

            case 10:
            return 'File already exists';

            case 11:
            return 'Can\'t open file';

            case 12:
            return 'Failure to create temporary file';

            case 13:
            return 'Zlib error';

            case 14:
            return 'Malloc failure';

            case 15:
            return 'Entry has been changed';

            case 16:
            return 'Compression method not supported';

            case 17:
            return 'Premature EOF';

            case 18:
            return 'Invalid argument';

            case 19:
            return 'Not a zip archive';

            case 20:
            return 'Internal error';

            case 21:
            return 'Zip archive inconsistent';

            case 22:
            return 'Can\'t remove file';

            case 23:
            return 'Entry has been deleted';

            default:
            return 'An unknown error has occurred('.intval($code).')';
        }
}

$filename = "/tmp/pi-hole-takeout.zip";
$zip = zip_open($filename);

if (!is_resource($zip)) {
    exit("cannot open/create $filename<br>Error message: ".message($zip)."\n");
}

$zip->addFile("/etc/pihole/whitelist.txt");
$zip->addFile("/etc/pihole/blacklist.txt");
$zip->addFile("/etc/pihole/setupVars.conf");
echo "numfiles: " . $zip->numFiles . "<br>";
echo "status:" . $zip->status . "<br>";
echo "statusSys: " . $zip->statusSys . "<br>";
echo "filename: " . $zip->filename . "<br>";
$zip->close();

?>
