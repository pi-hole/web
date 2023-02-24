<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

// Array of available themes and their description
$available_themes = array();
/* Array key = name used internally, not shown to the user
*  Array[0] = Description
*  Array[1] = Is this a dark mode theme? (Sets background to black during page reloading to avoid white "flashing")
*  Array[2] = Style sheet name
*  Array[3] = Theme color
*/
$available_themes['default-light'] = array('Pi-hole default theme (light, default)', false, 'default-light', '#367fa9');
$available_themes['default-dark'] = array('Pi-hole midnight theme (dark)', true, 'default-dark', '#272c30');
$available_themes['default-darker'] = array('Pi-hole deep-midnight theme (dark)', true, 'default-darker', '#2e6786');
$available_themes['high-contrast'] = array('High contrast light', false, 'high-contrast', '#0078a0');
$available_themes['high-contrast-dark'] = array('High contrast dark', false, 'high-contrast-dark', '#0077c7');
// Option to have the theme go with the device dark mode setting, always set the background to black to avoid flashing
$available_themes['default-auto'] = array('Pi-hole auto theme (light/dark)', true, 'default-auto', '#367fa9');
$available_themes['lcars'] = array('Star Trek LCARS theme (dark)', true, 'lcars', '#4488FF');

$webtheme = '';
// Try to load theme settings from setupVars.conf
if (isset($setupVars['WEBTHEME'])) {
    $webtheme = $setupVars['WEBTHEME'];
}

// May be overwritten by settings tab
if (isset($_POST['field'])
    && $_POST['field'] === 'webUI'
    && isset($_POST['webtheme'])) {
    $webtheme = $_POST['webtheme'];
}

if (!array_key_exists($webtheme, $available_themes)) {
    // Fallback to default (light) theme is property is not set
    // or requested theme is not among the available
    $webtheme = 'default-auto';
}

$darkmode = $available_themes[$webtheme][1];
$theme = $available_themes[$webtheme][2];
$theme_color = $available_themes[$webtheme][3];

function theme_selection()
{
    global $available_themes, $webtheme;
    foreach ($available_themes as $key => $value) {
        ?><div><input type="radio" name="webtheme" value="<?php echo $key; ?>" id="webtheme_<?php echo $key; ?>" <?php if ($key === $webtheme) { ?>checked<?php } ?>>
        <label for="webtheme_<?php echo $key; ?>"><strong><?php echo $value[0]; ?></strong></label></div>
<?php
    }
}
?>
