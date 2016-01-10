<?php
/**
 * Misc
 * @author Daniel Reiser
 * @package PiHole Admin Dashboard
 *
 */

define("DNSMASQ_CONF_PATH", "/etc/dnsmasq.conf");

class NameserverHelper {

    CONST BEGIN_MARKER = "# BEGIN CUSTOM NAMESERVERS";
    CONST END_MARKER   = '# END CUSTOM NAMESERVERS';

    /* ==========================================================================
    PUBLIC FUNCTIONS
    ========================================================================== */

    public static function getCustomNameserverEntries() {
        $result = array();

        $re1='(server)';	# Word 1
        $re2='(=)';	# Any Single Character 1
        $re3='(\\/)';	# Any Single Character 2
        $re4='((?:[a-z][a-z\\.\\d\\-]+)\\.(?:[a-z][a-z\\-]+))(?![\\w\\.])';	# Fully Qualified Domain Name 1
        $re5='(\\/)';	# Any Single Character 3
        $re6='((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(?![\\d])';	# IPv4 IP Address 1
        $re7='( )';	# Any Single Character 4
        $re8='(#)';	# Any Single Character 5
        $re9='((?:[a-z][a-z]+))';	# Word 2

        foreach ( self::extract_nameserverstrings() as $nameserverString) {
            if ( $c=preg_match_all ("/".$re1.$re2.$re3.$re4.$re5.$re6.$re7.$re8.$re9."/is", $nameserverString, $matches) ) {
                $result[] = [
                    "domain" => $matches[4][0],
                    "ip"     => $matches[6][0],
                    "id"     => $matches[9][0]
                 ];
            } else {
                echo "no match";
            }
        }
        return $result;
    }

    public static function addCustomNameserver( $domain, $ip ) {
        if ( file_exists(DNSMASQ_CONF_PATH) ) {
            return self::insert_with_markers( array(self::buildNameserverEntry($domain, $ip)) );
        }

        return false;
    }

    public static function updateCustomNameservers( $rules ) {
        if ( !file_exists(DNSMASQ_CONF_PATH) ) {
            $rules = explode( "\n", $rules );
            return self::insert_with_markers( $rules );
        }

        return false;
    }

    public static function removeNameserver( $id ) {

        if (!file_exists( DNSMASQ_CONF_PATH ) || $id === "" ) {
            return false;
        }

        $dnsconfData = explode( "\n", file_get_contents( DNSMASQ_CONF_PATH ) );

        // Split out the existing file into the preceeding lines, and those that appear after the marker
        $pre_lines = $post_lines = $existing_lines = array();
        $found_marker = $found_end_marker = false;
        foreach ( $dnsconfData as $line ) {
            if ( ! $found_marker && false !== strpos( $line, self::BEGIN_MARKER ) ) {
                $found_marker = true;
                continue;
            } elseif ( ! $found_end_marker && false !== strpos( $line, self::END_MARKER ) ) {
                $found_end_marker = true;
                continue;
            }
            if ( ! $found_marker ) {
                $pre_lines[] = $line;
            } elseif ( $found_marker && $found_end_marker ) {
                $post_lines[] = $line;
            } else {
                $existing_lines[] = $line;
            }
        }

        foreach ($existing_lines as $key => $line) {
            if ( strpos($line, $id) !== false ) {
                unset($existing_lines[$key]);
            }
        }

        // Generate the new file data
        $new_file_data = implode( "\n", array_merge(
            $pre_lines,
            array( self::BEGIN_MARKER ),
            $existing_lines,
            array( self::END_MARKER ),
            $post_lines
        ) );

        return (bool) file_put_contents(DNSMASQ_CONF_PATH, $new_file_data);
    }

    /* ==========================================================================
    PRIVATE FUNCTIONS
    ========================================================================== */
    private static function buildNameserverEntry($domain, $ip) {
        $id = substr( str_shuffle("abcdefghijklmnopqrstuvwxyz"), 0, 16);
        return 'server=/' . $domain . '/' . $ip . ' #' . $id;
    }

    private static function extract_nameserverstrings() {
        $result = array();

        if (!file_exists( DNSMASQ_CONF_PATH ) ) {
            return $result;
        }

        if ( $markerdata = explode( "\n", file_get_contents( DNSMASQ_CONF_PATH ) ) ) {
            $state = false;
            foreach ( $markerdata as $markerline ) {
                if (strpos($markerline, self::END_MARKER) !== false)
                    $state = false;
                if ( $state )
                    $result[] = $markerline;
                if (strpos($markerline, self::BEGIN_MARKER) !== false)
                    $state = true;
            }
        }
        return $result;
    }


    private static function insert_with_markers( $insertion ) {

        if (!file_exists( DNSMASQ_CONF_PATH ) ) {
            return false;
        }

        if ( ! is_array( $insertion ) ) {
            $insertion = explode( "\n", $insertion );
        }

        $dnsconfData = explode( "\n", file_get_contents( DNSMASQ_CONF_PATH ) );

        // Split out the existing file into the preceeding lines, and those that appear after the marker
        $pre_lines = $post_lines = $existing_lines = array();
        $found_marker = $found_end_marker = false;
        foreach ( $dnsconfData as $line ) {
            if ( ! $found_marker && false !== strpos( $line, self::BEGIN_MARKER ) ) {
                $found_marker = true;
                continue;
            } elseif ( ! $found_end_marker && false !== strpos( $line, self::END_MARKER ) ) {
                $found_end_marker = true;
                continue;
            }
            if ( ! $found_marker ) {
                $pre_lines[] = $line;
            } elseif ( $found_marker && $found_end_marker ) {
                $post_lines[] = $line;
            } else {
                $existing_lines[] = $line;
            }
        }

        // Check to see if there was a change
        if ( $existing_lines === $insertion ) {
            return true;
        }

        // Generate the new file data
        $new_file_data = implode( "\n", array_merge(
            $pre_lines,
            array( self::BEGIN_MARKER ),
            $existing_lines,
            $insertion,
            array( self::END_MARKER ),
            $post_lines
        ) );

        return (bool) file_put_contents(DNSMASQ_CONF_PATH, $new_file_data);
    }




}
