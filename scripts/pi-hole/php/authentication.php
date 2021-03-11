<?php
require_once('password_authentication.php');
require_once('ldap_authentication.php');

class Authentication
{

    private $config;
    private $passwordAuthentication;
    private $ldapAuthentication;
    private $ldapAuth;

    public function __construct($config)
    {
        $this->config = $config;
        $this->passwordAuthentication = new PasswordAuthentication($config);
        $this->ldapAuthentication = new LdapAuthentication($config);
        $this->ldapAuth = $this->isLdapAuth();
    }

    public function passwordHash()
    {
        return $this->passwordAuthentication->passwordHash();
    }

    private function isPasswordAuth()
    {
        return $this->passwordAuthentication->passwordHash() != '';
    }

    public function isLdapAuth()
    {
        $auth = $this->config['LDAP_AUTH'];
        if (!isset($auth))
            return false;
        return $auth == 1;
    }

    public function isAuthEnabled()
    {
        return $this->isPasswordAuth() || $this->isLdapAuth();
    }

    private function authenticateLdap($username, $password)
    {
        return $this->ldapAuthentication->authenticate($username, $password);
    }

    private function authenticatePassword($persistentLogin, $password)
    {
        return $this->passwordAuthentication->authenticate($persistentLogin, $password);
    }

    private function authenticateApi($authHash)
    {
        return $this->passwordAuthentication->passwordHashMatches($authHash);
    }

    private function sessionExists()
    {
        $res = isset($_SESSION["hash"]);
        error_log("authenticated: " . $res);
        return $res;
    }

    private function createSession()
    {
        error_log("create session, ldap: " . $this->ldapAuth);
        session_regenerate_id();
        $_SESSION = array();
        if ($this->ldapAuth) {
            $hash = "ldap";
        } else {
            $hash = $this->passwordHash();;
        }
        $_SESSION["hash"] = $hash;
        header('Location: index.php');
        exit();
    }

    public function authenticate()
    {
        if ($this->isAuthEnabled() && !$this->sessionExists()) {
            $wrongPassword = false;
            $password = $_POST["pw"];
            if ($this->ldapAuth) {
                $authenticated = $this->authenticateLdap($_POST["username"], $password);
            } else {
                $authenticated = $this->authenticatePassword($_COOKIE["persistentlogin"], $password);
            }
            if ($authenticated) {
                $this->createSession();
            } else {
                $wrongPassword = isset($password);
                $authHash = $_GET["auth"];
                if (isset($api) && isset($authHash)) {
                    $authenticated = $this->authenticateApi($authHash);
                }
            }
            return new UserAuthStatus($authenticated, $wrongPassword, $this->ldapAuth);
        } else {
            return new UserAuthStatus(true, false, false);
        }
    }

}
