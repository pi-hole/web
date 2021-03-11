<?php
require_once('user_auth_status.php');

class LdapAuthentication
{

    private $config;

    function __construct($config)
    {
        $this->config = $config;
    }

    public function authenticate($username, $password)
    {
        $server = $this->config['LDAP_SERVER'];
        $ldap = ldap_connect($server);
        ldap_set_option($ldap, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_set_option($ldap, LDAP_OPT_REFERRALS, 0);
        $bindDn = sprintf($this->config['LDAP_BIND_DN'], $username);
        return @ldap_bind($ldap, $bindDn, $password);
    }
}
