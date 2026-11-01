"use strict";

const $ = (selector) => document.querySelector(selector);
const loginForm = $("#loginForm");
const signupForm = $("#signupForm");
const authArea = $("#authArea");
const userPanel = $("#userPanel");
const userEmail = $("#userEmail");
const statusMessage = $("#statusMessage");
const logoutButton = $("#logoutButton");
const loginButton = $("#loginButton");
const signupButton = $("#signupButton");
const googleLoginButton = $("#googleLoginButton");
const googleSignupButton = $("#googleSignupButton");

let supabaseClient = null;

function showStatus(message = "", type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
}

function isConfigPlaceholder() {
  return !window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY ||
    window.SUPABASE_URL.includes("YOUR_") ||
    window.SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
}

function isEmailValid(email) { return email.includes("@"); }

function validatePassword(password) {
  if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ viết hoa.";
  if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ viết thường.";
  if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ số.";
  return "";
}

function setLoading(button, loading, loadingText) {
  if (!button.dataset.defaultText) button.dataset.defaultText = button.textContent;
  button.disabled = loading;
  button.textContent = loading ? loadingText : button.dataset.defaultText;
}

function getErrorMessage(error) {
  const text = String(error?.message || "").toLowerCase();
  if (text.includes("already registered")) return "Email này đã được đăng ký.";
  if (text.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng.";
  if (text.includes("password should be")) return "Mật khẩu chưa đáp ứng yêu cầu.";
  if (text.includes("email not confirmed")) return "Bạn chưa xác nhận email. Hãy kiểm tra hộp thư.";
  if (text.includes("popup")) return "Cửa sổ đăng nhập Google bị đóng hoặc bị chặn.";
  if (text.includes("network")) return "Lỗi mạng. Hãy kiểm tra kết nối Internet.";
  return error?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
}

function renderUserState(user) {
  const loggedIn = Boolean(user);
  authArea.classList.toggle("hidden", loggedIn);
  userPanel.classList.toggle("hidden", !loggedIn);
  if (loggedIn) {
    userEmail.textContent = user.email || "Tài khoản Google";
    showStatus("Đăng nhập thành công.", "success");
  }
}

async function initializeSupabase() {
  if (!window.supabase) {
    showStatus("Không tải được Supabase SDK. Hãy kiểm tra kết nối Internet.", "error");
    return;
  }
  if (isConfigPlaceholder()) {
    showStatus("Hãy dán Supabase URL và Publishable/anon key vào supabase-config.js.", "error");
    return;
  }
  try {
    supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    renderUserState(data.session?.user || null);
    supabaseClient.auth.onAuthStateChange((_event, session) => renderUserState(session?.user || null));
  } catch (error) {
    showStatus("Không thể kết nối Supabase. Hãy kiểm tra cấu hình dự án.", "error");
  }
}

async function signInWithGoogle(button) {
  if (!supabaseClient) return showStatus("Supabase chưa sẵn sàng.", "error");
  setLoading(button, true, "Đang chuyển đến Google...");
  showStatus();
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href }
    });
    if (error) throw error;
  } catch (error) {
    showStatus(getErrorMessage(error), "error");
    setLoading(button, false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return showStatus("Supabase chưa sẵn sàng.", "error");
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value;
  if (!isEmailValid(email)) return showStatus("Email phải có ký tự @.", "error");
  const passwordError = validatePassword(password);
  if (passwordError) return showStatus(passwordError, "error");
  setLoading(loginButton, true, "Đang đăng nhập...");
  showStatus();
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (error) {
    showStatus(getErrorMessage(error), "error");
  } finally {
    setLoading(loginButton, false);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return showStatus("Supabase chưa sẵn sàng.", "error");
  const email = $("#signupEmail").value.trim();
  const password = $("#signupPassword").value;
  const confirmPassword = $("#confirmPassword").value;
  if (!isEmailValid(email)) return showStatus("Email phải có ký tự @.", "error");
  const passwordError = validatePassword(password);
  if (passwordError) return showStatus(passwordError, "error");
  if (password !== confirmPassword) return showStatus("Xác nhận mật khẩu chưa trùng khớp.", "error");
  setLoading(signupButton, true, "Đang tạo tài khoản...");
  showStatus();
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) showStatus("Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản.", "success");
  } catch (error) {
    showStatus(getErrorMessage(error), "error");
  } finally {
    setLoading(signupButton, false);
  }
});

googleLoginButton.addEventListener("click", () => signInWithGoogle(googleLoginButton));
googleSignupButton.addEventListener("click", () => signInWithGoogle(googleSignupButton));

logoutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  setLoading(logoutButton, true, "Đang đăng xuất...");
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    showStatus("Bạn đã đăng xuất.", "success");
  } catch (error) {
    showStatus(getErrorMessage(error), "error");
  } finally {
    setLoading(logoutButton, false);
  }
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.textContent = hidden ? "◉" : "◌";
  });
});

initializeSupabase();
