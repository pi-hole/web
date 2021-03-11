<?php
require_once('user_auth_status.php');

class PasswordAuthentication
{

    private $config;

    function __construct($config)
    {
        $this->config = $config;
    }

    function passwordHashMatches($authHash)
    {
        return hash_equals($this->passwordHash(), $authHash);
    }

    public function passwordHash()
    {
        $password = $this->config['WEBPASSWORD'];
        if (isset($password))
            return $password;
        return '';
    }

    function passwordMatches($password)
    {
        $hash = hash('sha256', hash('sha256', $password));
        return hash_equals($this->passwordHash(), $hash);
    }

    function authenticate($persistentLogin, $password)
    {
        if (isset($persistentLogin)) {
            $authenticated = $this->passwordHashMatches($persistentLogin);
            if ($authenticated) {
                setcookie('persistentlogin', $this->passwordHash(), time() + 60 * 60 * 24 * 7);
            } else {
                setcookie('persistentlogin', '', 1);
            }
            return $authenticated;
        }

        if (isset($password)) {
            $authenticated = $this->passwordMatches($password);
            if ($authenticated) {
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['QUERY_STRING'] === 'login') {
                    if (isset($_POST['persistentlogin'])) {
                        setcookie('persistentlogin', $this->passwordHash(), time() + 60 * 60 * 24 * 7);
                    }
                }
            }
            return $authenticated;
        }
        return false;
    }
}
