<?php

/* Pi-hole: A black hole for Internet advertisements
*  (c) 2022 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->ignoreDotFiles(false)
    ->ignoreVCSIgnored(true)
    ->exclude('scripts/vendor')
    ->in(__DIR__)
;

$config = new PhpCsFixer\Config();
$config
    ->setRules(array(
        '@Symfony' => true,
        'array_syntax' => array('syntax' => 'long'),
        'yoda_style' => array('equal' => false, 'identical' => false, 'less_and_greater' => false, 'always_move_variable' => false),
    ))
    ->setLineEnding(PHP_EOL)
    ->setFinder($finder)
;

return $config;
