// Brand assets come from the DealerSiteAudit kit in /UI Reference.
//
// The export keys are unchanged so every existing consumer keeps working; only the
// files behind them are new. Callers pick a logo with `darkMode ? Logo : DarkLogo`,
// where the key names describe the *background* the logo sits on:
//   Logo      -> white wordmark, for dark backgrounds
//   DarkLogo  -> navy wordmark, for light backgrounds (the app is light-only today)
import LogoNavy from "./brand/logo-horizontal-navy.png";
import LogoWhite from "./brand/logo-horizontal-white.png";
import IconNavy from "./brand/icon-navy.svg";
import ReactLogo from "./react.svg";
import Bg from "./bg.jpg";
import DarkBg from "./darkbg.jpg";

const Assets = {
  Logo: LogoWhite,
  ReactLogo,
  DarkLogo: LogoNavy,
  Bg,
  DarkBg,
  SiteAuditLogo: LogoNavy,
  LightLogo: LogoWhite,
  // Square mark for tight spots (avatars, tabs, compact headers).
  Icon: IconNavy,
};

export default Assets;
