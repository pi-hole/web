<?php
    // Networking
    if(isset($setupVars["PIHOLE_INTERFACE"])){
        $piHoleInterface = $setupVars["PIHOLE_INTERFACE"];
    } else {
        $piHoleInterface = "unknown";
    }
    if(isset($setupVars["IPV4_ADDRESS"])){
        $piHoleIPv4 = $setupVars["IPV4_ADDRESS"];
    } else {
        $piHoleIPv4 = "unknown";
    }
    $IPv6connectivity = false;
    if(isset($setupVars["IPV6_ADDRESS"])){
        $piHoleIPv6 = $setupVars["IPV6_ADDRESS"];
            sscanf($piHoleIPv6, "%2[0-9a-f]", $hexstr);
            if(strlen($hexstr) == 2)
            {
                // Convert HEX string to number
                $hex = hexdec($hexstr);
                // Global Unicast Address (2000::/3, RFC 4291)
                $GUA = (($hex & 0x70) === 0x20);
                // Unique Local Address   (fc00::/7, RFC 4193)
                $ULA = (($hex & 0xfe) === 0xfc);
                if($GUA || $ULA)
                {
                    // Scope global address detected
                    $IPv6connectivity = true;
                }
            }
    } else {
        $piHoleIPv6 = "unknown";
    }
    $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");
?>
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Networking</h3>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label>Pi-hole Ethernet Interface</label>
                    <div class="input-group">
                        <div class="input-group-addon"><i class="fa fa-plug"></i></div>
                        <input type="text" class="form-control" disabled value="<?php echo $piHoleInterface; ?>">
                    </div>
                </div>
                <div class="form-group">
                    <label>Pi-hole IPv4 address</label>
                    <div class="input-group">
                        <div class="input-group-addon"><i class="fa fa-plug"></i></div>
                        <input type="text" class="form-control" disabled value="<?php echo $piHoleIPv4; ?>">
                    </div>
                </div>
                <div class="form-group">
                    <label>Pi-hole IPv6 address</label>
                    <div class="input-group">
                        <div class="input-group-addon"><i class="fa fa-plug"></i></div>
                        <input type="text" class="form-control" disabled value="<?php echo $piHoleIPv6; ?>">
                    </div>
                    <?php if (!defined('AF_INET6')){ ?><p style="color: #F00;">Warning: PHP has been compiled without IPv6 support.</p><?php } ?>
                </div>
                <div class="form-group">
                    <label>Pi-hole hostname</label>
                    <div class="input-group">
                        <div class="input-group-addon"><i class="fa fa-laptop"></i></div>
                        <input type="text" class="form-control" disabled value="<?php echo $hostname; ?>">
                    </div>
                </div>
            </div>
        </div>
