    <!-- Title/Header -->
    <div class="app-content-header">
        <div class="container-fluid">
            <div class="row">
                <div class="col-sm-6">
                    <h1><?= PageTitle ?></h1>
                </div>
                <div class="col-sm-6">
                    <div class="settings-selector d-flex align-items-center justify-content-end h-100">
<? if scriptname ~= 'settings/all' then
    -- Show the level selector, except in All Settings page
?>
                        <input type="checkbox" id="expert-settings">
<? else ?>
                        <input type="checkbox" id="only-changed">
<? end ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
