<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

// Array of available themes and their description
$available_themes = [];
/* Array key = name used internally, not shown to the user
*  Array[0] = Description
*  Array[1] = Is this a dark mode theme? (Sets background to black during page reloading to avoid white "flashing")
*  Array[2] = Style sheet name
*  Array[3] = Radio/checkbox theme name
*  Array[4] = Radio/checkbox theme variant
*/
$available_themes["default-light"] = ["Pi-hole default theme (light, default)", false, "default-light", "minimal", "blue"];
$available_themes["default-dark"] = ["Pi-hole midnight theme (dark)", true, "default-dark", "polaris", "polaris"];
$available_themes["default-dark2"] = ["Pi-hole afternoon theme (dark)", true, "default-dark", "futurico", "futurico"];

$webtheme = "";
// Try to load theme settings from setupVars.conf
if(isset($setupVars['WEBTHEME']))
    $webtheme = $setupVars['WEBTHEME'];

// May be overwritten by settings tab
if(isset($_POST["field"]) &&
   $_POST["field"] === "webUI" &&
   isset($_POST["webtheme"])) {
    $webtheme = $_POST["webtheme"];
}

if(!array_key_exists($webtheme,$available_themes)) {
        // Fallback to default (light) theme is property is not set
        // or requested theme is not among the available
        $webtheme = "default-light";
}

$darkmode = $available_themes[$webtheme][1];
$theme = $available_themes[$webtheme][2];
$checkbox_theme_name = $available_themes[$webtheme][3];
$checkbox_theme_variant = $available_themes[$webtheme][4];

error_log(print_r($available_themes,true));
function theme_selection() {
    global $available_themes, $webtheme;
    foreach ($available_themes as $key => $value) {
        ?><input type="radio" name="webtheme" value="<?php echo $key; ?>" id="webtheme_<?php echo $key; ?>" <?php if ($key === $webtheme){ ?>checked<?php } ?>>
        <label for="webtheme_<?php echo $key; ?>"><?php echo $value[0]; ?></label><br><?php
    }
}
?>