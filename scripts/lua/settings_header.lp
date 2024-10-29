<!-- Title -->
<div class="page-header flex-header">
    <h1><?= PageTitle ?></h1>
    <div class="settings-selector">
<? if scriptname ~= 'settings/all' then
    -- Show the level selector, except in All Settings page
?>
        <input type="checkbox" id="expert-settings">
<? else ?>
        <input type="checkbox" id="only-changed">
<? end ?>
    </div>
</div>
