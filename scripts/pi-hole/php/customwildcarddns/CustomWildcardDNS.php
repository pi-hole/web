<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/
/* author DjoSmer */

namespace Custom;

class WildcardDNS
{
    protected static $instance;

    static $DNSMASQ_DIR = '/etc/dnsmasq.d/';
    static $CONF_FILENAME = '15-pihole-custom-wildcarddns.conf';
    static $DIR_NAME = '15-pihole-custom-wildcarddns.d';

    /**
     * The variable is needed for the clear to be executed once.
     * @var bool
     */
    private $_flushedData = false;

    public static function getInstance()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self;
        }
        return self::$instance;
    }

    protected function __construct()
    {
    }

    /**
     * @param string $filename
     * @param array $entries
     * @return array
     */
    protected function fileProcessing($filename, $entries)
    {
        $name = basename($filename, '.conf');
        $content = file_get_contents($filename);
        $lines = explode(PHP_EOL, $content);
        foreach ($lines as $line) {
            if (empty($line)) {
                continue;
            }

            list($type, $domain, $ip) = explode('/', $line);

            $data = new \stdClass();
            $data->name = $name;
            $data->domain = $domain;
            $data->ip = $ip;
            $data->enabled = (int)($type[0] !== '#');
            $entries[] = $data;
        }

        return $entries;
    }

    function getEntries()
    {
        $customWildcardDNSDir = self::$DNSMASQ_DIR . self::$DIR_NAME;

        $entries = array();

        if (!file_exists($customWildcardDNSDir)) {
            return $entries;
        }

        $dir = opendir($customWildcardDNSDir);

        if (!$dir) {
            return $entries;
        }

        while (false !== ($entry = readdir($dir))) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $entries = $this->fileProcessing($customWildcardDNSDir . DIRECTORY_SEPARATOR . $entry, $entries);

        }
        closedir($dir);

        return $entries;
    }

    /**
     * @param string $name
     * @param string $domain
     * @param string $ip
     * @param bool $reload
     * @param bool $enabled
     * @return array|bool
     */
    function addEntry($name, $domain, $ip, $reload = false, $enabled = true)
    {
        try {
            if (empty($domain)) {
                return returnError('Domain must be set');
            }

            if (empty($ip)) {
                return returnError('IP must be set');
            }

            if (!validDomain($name)) {
                return returnError('Wildcard DNS Name must be valid');
            }

            if (!validIP($ip)) {
                return returnError('IP must be valid');
            }

            $num = 0;
            $domains = array_map('trim', explode(',', $domain));
            foreach ($domains as $d) {
                // Check if each submitted domain is valid
                if (!validDomain($d)) {
                    return returnError("Domain '{$d}' is not valid");
                }

                ++$num;
            }

            $existingEntries = $this->getEntries();

            // Check if a record for one of the domains already exists
            foreach ($existingEntries as $entry) {
                foreach ($domains as $d) {
                    if (in_array($d, $entry->domains)) {
                        return returnError("There is already a Wildcard DNS record for '{$d}'");
                    }
                }
            }

            // if $reload is not set and more then one domain is supplied, restart FTL only once after all entries were added
            if (($num > 0) && (empty($reload))) {
                $reload = 'false';
            }
            // add records
            foreach ($domains as $d) {
                pihole_execute(implode(' ', ['-a', 'addcustomwildcarddns', $name, $d, $ip, $enabled, $reload]));
            }

            return returnSuccess(sprintf('Custom Wildcard DNS added %s: %s -> %s%s', $name, $domain, $ip, !$enabled ? ' (disabled)' : ''));
        } catch (\Exception $ex) {
            return returnError($ex->getMessage());
        }
    }

    /**
     * @param string $name
     * @param string $domain
     * @param string $ip
     * @param bool $enabled
     * @return array|bool
     */
    function updateEntry($name, $domain, $ip, $enabled)
    {
        try {
            if (empty($name)) {
                return returnError('Wildcard DNS Name must be set');
            }

            if (empty($domain)) {
                return returnError('Domain must be set');
            }

            if (empty($ip)) {
                return returnError('IP must be set');
            }

            pihole_execute(implode(' ', ['-a', 'updatecustomwildcarddns', $name, $domain, $ip, $enabled]));

            return returnSuccess(sprintf('Custom Wildcard DNS updated %s: %s -> %s', $name, $domain, $ip));
        } catch (\Exception $ex) {
            return returnError($ex->getMessage());
        }
    }

    /**
     * @param string $name
     * @param string $domain
     * @return array|bool
     */
    function deleteEntry($name, $domain)
    {
        try {
            if (empty($name)) {
                return returnError('Wildcard DNS Name must be set');
            }

            if (empty($domain)) {
                return returnError('Domain must be set');
            }

            $existingEntries = $this->getEntries();

            $found = false;
            foreach ($existingEntries as $entry) {
                if ($entry->domain == $domain && $entry->name == $name) {
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return returnError('This name/domain association does not exist');
            }

            pihole_execute(implode(' ', ['-a', 'removecustomwildcarddns', $name, $domain]));

            return returnSuccess(sprintf('Custom Wildcard DNS deleted %s: %s', $name, $domain));
        } catch (\Exception $ex) {
            return returnError($ex->getMessage());
        }
    }

    function deleteAllEntries() {
        if ($this->_flushedData) {
            return;
        }

        $this->_flushedData = true;
        try {
            $entries = $this->getEntries();
            foreach ($entries as $entry) {
                pihole_execute(implode(' ', ['-a', 'removecustomwildcarddns', $entry->name, $entry->domain, false]));
            }
        } catch (\Exception $ex) {
            return returnError($ex->getMessage());
        }
    }

    /**
     * @param bool $flushData
     * @param \PharFileInfo $file
     * @return bool
     */
    function teleporterImport($flushData, $file)
    {
        echo 'Custom Wildcard DNS record Importing...' . "<br>\n";

        if ($flushData) {
            $this->deleteAllEntries();
        }

        $entries = [];
        $entries = $this->fileProcessing($file, $entries);

        foreach ($entries as $entry) {
            $result = $this->addEntry($entry->name, $entry->domain, $entry->ip, false, (bool)$entry->enabled);
            if (!empty($result['message'])) {
                echo $result['message'] . "<br>\n";
            }
        }

        echo 'Custom Wildcard DNS record is done' . "<br>\n";

        return true;
    }
}
