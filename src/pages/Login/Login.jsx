import './Login.css';
import {useContext, useState} from "react";
import toast from "react-hot-toast";
import {login} from "../../Service/AuthService.js";
import {useNavigate} from "react-router-dom";
import {AppContext} from "../../context/AppContext.jsx";

const NUMPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];
const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 12;

const maskPin = (pin) => {
    if (!pin) return "";
    if (pin.length === 1) return pin;
    return "•".repeat(pin.length - 1) + pin.slice(-1);
};

const Login = () => {
    const {setAuthData} = useContext(AppContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");

    const setDigitPassword = (next) => {
        const digitsOnly = String(next).replace(/\D/g, "").slice(0, MAX_PIN_LENGTH);
        setPassword(digitsOnly);
    };

    const onNumpadPress = (key) => {
        if (key === "C") {
            setDigitPassword("");
            return;
        }
        if (key === "⌫") {
            setDigitPassword(password.slice(0, -1));
            return;
        }
        setDigitPassword(password + key);
    };

    const onPasswordKeyDown = (e) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            setDigitPassword(password.slice(0, -1));
            return;
        }
        if (e.key === "Enter") {
            return;
        }
        if (/^\d$/.test(e.key)) {
            e.preventDefault();
            setDigitPassword(password + e.key);
            return;
        }
        if (e.key.length === 1) {
            e.preventDefault();
        }
    };

    const onPasswordPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData?.getData("text") ?? "";
        setDigitPassword(password + pasted);
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!/^\d+$/.test(password)) {
            toast.error("Въведете цифрова парола");
            return;
        }
        if (password.length < MIN_PIN_LENGTH) {
            toast.error(`Паролата трябва да е поне ${MIN_PIN_LENGTH} цифри`);
            return;
        }
        setLoading(true);
        try {
            const response = await login({password});
            if (response.status === 200) {
                toast.success(`Успешен вход: ${response.data.name}`);
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("email");
                localStorage.removeItem("name");
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('auth') || key.startsWith('user') || key.startsWith('session')) {
                        localStorage.removeItem(key);
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("role", response.data.role);
                localStorage.setItem("email", response.data.email);
                localStorage.setItem("name", response.data.name);
                setAuthData(response.data.token, response.data.role, response.data.email, response.data.name);
                const home = response.data.role === "ROLE_ADMIN" ? "/dashboard" : "/explore";
                navigate(home, { replace: true });
            }
        } catch (error) {
            console.error(error);
            const status = error.response?.status;
            const raw = error.response?.data;
            let msg = "Невалидна парола";
            if (status === 403) {
                if (typeof raw === "string" && raw.trim()) {
                    msg = raw;
                } else if (raw?.message) {
                    msg = raw.message;
                } else {
                    msg = "Абонаментът не е активен. Свържете се с доставчика на софтуера.";
                }
            } else if (typeof raw === "string" && raw.trim()) {
                msg = raw;
            } else if (raw?.message) {
                msg = raw.message;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-light d-flex align-items-center justify-content-center vh-100 login-background">
            <div className="card shadow-lg w-100 login-card">
                <div className="card-body">
                    <div className="text-center">
                        <h1 className="card-title">Вход</h1>
                       
                    </div>
                    <div className="mt-4">
                        <form onSubmit={onSubmitHandler}>
                            <div className="mb-3">
                                
                                <input
                                    type="text"
                                    name="password"
                                    id="password"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    placeholder={"•".repeat(MIN_PIN_LENGTH)}
                                    className="form-control form-control-lg text-center login-password-display"
                                    onKeyDown={onPasswordKeyDown}
                                    onPaste={onPasswordPaste}
                                    onChange={() => {}}
                                    value={maskPin(password)}
                                    maxLength={MAX_PIN_LENGTH}
                                    aria-label="Цифрова парола"
                                />
                            </div>

                            <div className="login-numpad" role="group" aria-label="Цифрова клавиатура за парола">
                                {NUMPAD_KEYS.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`login-numpad-key${key === "C" || key === "⌫" ? " login-numpad-key-action" : ""}`}
                                        onClick={() => onNumpadPress(key)}
                                        disabled={loading}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>

                            <div className="d-grid mt-3">
                                <button
                                    type="submit"
                                    className="btn btn-dark btn-lg"
                                    disabled={loading || password.length < MIN_PIN_LENGTH}
                                >
                                    {loading ? "Зареждане..." : "Вход"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login;
