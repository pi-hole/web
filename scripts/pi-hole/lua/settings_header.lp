<!-- Title -->
<div class="page-header flex-header">
    <h1><?= PageTitle ?></h1>
<?
if scriptname ~= 'settings/all' then
    -- Show the level selector, except in All Settings page
?>
    <div class="settings-selector">
        Settings level: <select id="settings-level" class="form-control input-sm"></select>
    </div>
<?
end
?>
</div>
