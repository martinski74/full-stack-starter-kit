<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail; // Added for email sending
use App\Mail\TwoFactorCodeMail; // Added for 2FA mail class
use App\Models\User; // Added for User model

class estailommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test'; // Changed signature

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test 2FA email to a specified user'; // Updated description

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->ask('To which email address should the test 2FA code be sent?');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found. Creating a temporary user...");
            $user = User::create([
                'name' => 'Test User',
                'email' => $email,
                'password' => bcrypt('password'),
            ]);
            $this->info("Temporary user {$email} created.");
        }

        $code = '123456'; // Dummy code for testing

        try {
            Mail::to($user->email)->send(new TwoFactorCodeMail($code));
            $this->info("Email sent successfully to {$user->email} with code {$code}.");
        } catch (Exception $e) {
            $this->error("Failed to send email: " . $e->getMessage());
            $this->error("Trace: " . $e->getTraceAsString());
        }
    }
}
