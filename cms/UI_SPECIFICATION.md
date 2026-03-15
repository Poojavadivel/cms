# MIT Connect UI Specification

This document describes the exact UI values used across the MIT Connect project. The purpose of this document is to explain the design in detail without changing any code. Every section is written in sentence form so it can be used as a formal project document.

## Global Foundation

The project uses the Inter font family throughout the full application. The body background color is `#f5f7fb`, and the default body text color is `#1f2937`. The global box model uses `box-sizing: border-box`, and the default margin and padding for all elements are reset to `0px`.

The main brand blue used in the project is `#2563eb`. The dark brand blue is `#1d4ed8`. The brand navy is `#163d8f`. The brand cyan is `#06b6d4`. The soft cyan accent is `#dff7ff`. The standard brand gradient is `linear-gradient(90deg, #2563eb, #06b6d4)`, and the strong brand gradient is `linear-gradient(135deg, #1d4ed8, #0891b2)`.

## Login Page Layout

The login page container uses a minimum height of `100vh`. The page background uses a light gradient from `#edf4ff` to `#f6f9ff` to `#eef7ff`. The page content is centered both vertically and horizontally using flex layout. The outer page padding is `28px` on desktop.

The main login shell uses a width of `min(1280px, 100%)`. The minimum shell height is `min(760px, calc(100vh - 56px))`. The shell uses a two-column grid with `1.1fr` for the left side and `0.9fr` for the right side. The shell border radius is `28px`. The shell border is `1px solid rgba(191, 219, 254, 0.7)`. The shell background is `rgba(255, 255, 255, 0.82)`. The shell shadow is `0 24px 70px rgba(37, 99, 235, 0.16)`.

## Login Showcase Panel

The left showcase panel uses `46px` of padding. The panel uses a vertical flex layout with `justify-content: space-between`. The text color inside this panel is white. The background combines an image with a color overlay. The overlay uses `rgba(15, 40, 104, 0.86)` and `rgba(37, 99, 235, 0.72)`.

The decorative overlay above the image uses two radial gradients. The first radial gradient uses `rgba(125, 211, 252, 0.28)`, and the second radial gradient uses `rgba(34, 211, 238, 0.18)`.

The small showcase badge uses horizontal padding of `14px` and vertical padding of `8px`. The badge border radius is `999px`. The badge background is `rgba(255, 255, 255, 0.14)`. The badge border is `1px solid rgba(255, 255, 255, 0.18)`. The badge font size is `12px`, and the badge font weight is `600`.

The showcase brand block uses a gap of `18px` between the icon and text. The top margin for this block is `20px`. The product title inside the brand block uses a font size of `40px`, a font weight of `800`, and a letter spacing of `-1px`. The supporting paragraph under the product title uses a font size of `15px`, a line height of `1.6`, and a maximum width of `380px`.

The showcase copy block uses a top margin of `44px`. The large headline uses a font size of `54px`, a font weight of `800`, a line height of `1.05`, a letter spacing of `-1.6px`, and a maximum width of `540px`. The paragraph under that headline uses a top margin of `18px`, a font size of `18px`, a line height of `1.75`, and a maximum width of `560px`.

The showcase feature grid uses a top margin of `36px`. The grid is a two-column grid with a gap of `18px`. Each showcase card uses `22px` padding, a border radius of `20px`, and a translucent gradient background from `rgba(59, 130, 246, 0.34)` to `rgba(34, 211, 238, 0.24)`. Each showcase card has a `1px solid rgba(255, 255, 255, 0.16)` border. Each showcase card also uses an inset shadow of `0 1px 0 rgba(255, 255, 255, 0.14)`.

The showcase card heading uses a font size of `18px` and a font weight of `700`. The showcase card paragraph uses a font size of `14px`, a line height of `1.6`, and a soft white text tone.

## Login Form Panel

The right login panel uses `52px 56px` of padding. This panel uses a near-white background of `rgba(255, 255, 255, 0.94)`. The panel is vertically centered using flexbox.

The login brand block uses a bottom margin of `28px`. The brand row uses a horizontal gap of `16px` between the icon and the text content. The login heading uses a font size of `24px`, a font weight of `700`, and a letter spacing of `-0.4px`. The login supporting text uses a font size of `14px` and the color `#6b7280`.

The brand icon used in the login page and the showcase area has a width of `56px` and a height of `56px`. The icon border radius is `12px`. The icon background uses the strong brand gradient. The icon shadow in the split login brand area is `0 12px 24px rgba(37, 99, 235, 0.2)`. The SVG icon inside this square uses a width of `30px`, a height of `30px`, and a white fill.

## Role Switcher

The role switcher uses a four-column grid. The gap between buttons is `10px`. The internal switcher padding is `8px`. The switcher background color is `#e9eef8`. The switcher border radius is `18px`. The switcher bottom margin is `24px`.

Each role switch button uses a height of `48px`. The button border radius is `14px`. The normal background is transparent. The normal text color is `#64748b`. The font size is `14px`, and the font weight is `700`.

The active role switch button uses white text and the main brand gradient as its background. The active button shadow is `0 8px 16px rgba(37, 99, 235, 0.24)`.

## Form Fields

Each form group uses a bottom margin of `20px`. Each label uses a font size of `14px`, a font weight of `500`, a color of `#374151`, and a bottom margin of `8px`.

Each text input, password input, and select control uses a height of `52px`. The field border is `1px solid #e5e7eb`. The field border radius is `14px`. The field padding is `0 16px 0 42px`, so the icon area is reserved on the left. The field font size is `14px`. The field text color is `#1f2937`. The field background color is `#ffffff`.

The field focus state changes the border color to `#2563eb` and adds a focus ring of `0 0 0 3px rgba(37, 99, 235, 0.1)`. The placeholder text color is `#9ca3af`.

The inline field icon uses a width of `18px`, a height of `18px`, a left offset of `14px`, and a muted fill of `#9ca3af`.

## Remember Me and Forgot Password Row

The remember and forgot row uses flex layout with `space-between` alignment. The bottom margin of this row is `24px`.

The checkbox label uses a font size of `14px`, a text color of `#6b7280`, and a gap of `8px` between the checkbox and text. The checkbox itself uses a width of `16px`, a height of `16px`, and the accent color `#2563eb`.

The forgot password link uses a font size of `14px`, a font weight of `500`, and the brand blue color `#2563eb`.

## Login Messages and Button

The login message box uses a bottom margin of `16px`, `12px 14px` padding, a border radius of `12px`, a font size of `13px`, and a font weight of `500`.

The error message uses a background color of `#fef2f2`, a border of `1px solid #fecaca`, and a text color of `#dc2626`.

The hint message uses a background color of `#eff6ff`, a border of `1px solid #bfdbfe`, and a text color of `#1d4ed8`.

The main login button uses a full width of `100%`. The button height is `54px`. The button border radius is `14px`. The button background uses the brand gradient. The button text color is white. The button font size is `16px`. The button font weight is `600`. The button letter spacing is `0.2px`. The gap between the icon and text is `8px`.

The login button hover state uses the strong brand gradient and a shadow of `0 4px 12px rgba(37, 99, 235, 0.35)`. The login button active state scales the button to `0.99`. The disabled button state uses an opacity of `0.85` and a wait cursor.

## Divider and Footer Links

The login divider uses a vertical margin of `24px` and a horizontal gap of `12px`. Each divider line uses a height of `1px` and the color `#e5e7eb`. The divider text uses a font size of `12px`, a font weight of `500`, and a text color of `#9ca3af`.

The footer links under the login form use flex layout with centered alignment. The gap between the links is `24px`. The link font size is `13px`. The normal link color is `#6b7280`. On hover, the link color becomes `#2563eb`.

## Dashboard Layout

The dashboard wrapper uses flex layout and fills the full viewport height. The sidebar width is fixed at `260px`. The main content area uses `margin-left: 260px`, flex growth of `1`, a padding of `32px`, and a minimum height of `100vh`.

## Sidebar

The sidebar background color is `#ffffff`. The sidebar right border is `1px solid #e5e7eb`. The sidebar is fixed to the left side of the screen and uses a transition duration of `0.3s` for movement.

The sidebar logo block uses `20px 20px 18px` padding. The bottom border under the logo uses `1px solid #f3f4f6`. The gap between the logo mark and logo text is `12px`.

The small square logo mark uses a width of `36px`, a height of `36px`, and a border radius of `8px`. The logo mark background uses the strong brand gradient. The SVG inside the mark uses a width of `20px`, a height of `20px`, and a white fill.

The main logo title uses a font size of `20px`, a font weight of `600`, and the color `#1f2937`. The logo subtitle uses a font size of `11px` and the color `#9ca3af`.

The sidebar navigation area uses `16px 0` padding. The navigation section label uses a font size of `11px`, a font weight of `600`, uppercase text, a letter spacing of `0.8px`, and `12px 20px 6px` padding.

Each sidebar menu link uses a height of `44px`. The link horizontal padding is `12px`. The link border radius is `8px`. The link font size is `15px`. The link font weight is `500`. The normal link color is `#6b7280`. The hover background is `#f3f4f6`, and the hover text color is `#1f2937`.

The active sidebar item uses the brand gradient background, a white text color, and a shadow of `0 8px 18px rgba(37, 99, 235, 0.18)`.

The sidebar footer uses `12px 10px 16px` padding and a top border of `1px solid #f3f4f6`. The logout link inside the footer uses a height of `44px`, a border radius of `8px`, a font size of `15px`, and a red text color of `#ef4444`. The logout hover background is `#fef2f2`. The logout icon uses a width of `20px`, a height of `20px`, and the same red fill.

## Top Bar

The top bar uses flex layout with `space-between` alignment and a bottom margin of `24px`. The dashboard title in the top bar uses a font size of `24px`, a font weight of `700`, and a color of `#1f2937`. The supporting text below the title uses a font size of `14px`, a color of `#6b7280`, and a top margin of `2px`.

The top bar right area uses a gap of `12px`. The role badge uses the badge component style with a light blue background and a dark blue text color.

## Profile Header

The profile header uses a white background, a border radius of `12px`, `24px` padding, a bottom margin of `24px`, and a subtle shadow of `0 1px 2px rgba(0, 0, 0, 0.05)`. The minimum height of the header is `100px`.

The left side of the profile header uses a gap of `20px` between the avatar and the text block. The profile meta row uses a gap of `20px` and wraps when necessary.

The circular avatar uses a width of `56px`, a height of `56px`, and a border radius of `50%`. The avatar background uses `linear-gradient(135deg, #2563eb, #06b6d4)`. The avatar text uses a font size of `20px`, a font weight of `700`, and white text.

The small online status dot uses a width of `13px`, a height of `13px`, a white border of `2px`, and a green background color of `#22c55e`.

The user name uses a font size of `22px`, a font weight of `600`, a bottom margin of `6px`, and a color of `#1f2937`. The metadata text uses a font size of `14px` and a color of `#6b7280`.

## Dashboard Action Buttons

The primary dashboard button uses a height of `40px`, horizontal padding of `16px`, a border radius of `8px`, the brand gradient background, white text, a font size of `14px`, and a font weight of `600`. The hover state uses the strong gradient and a shadow of `0 4px 10px rgba(37, 99, 235, 0.3)`.

The secondary dashboard button uses a height of `40px`, horizontal padding of `16px`, a border radius of `8px`, a border of `1px solid #e5e7eb`, a text color of `#374151`, and a transparent background. The hover background becomes `#f9fafb`, and the hover border color becomes `#d1d5db`.

## Section Titles and Cards

The section header uses flex layout with `space-between` alignment and a bottom margin of `16px`. The section title uses a font size of `18px`, a font weight of `600`, and the color `#1f2937`.

Each white content card in the dashboard uses a white background, a border radius of `12px`, `20px` padding, a bottom margin of `24px`, a border of `1px solid #f3f4f6`, and a subtle shadow of `0 1px 2px rgba(0, 0, 0, 0.05)`.

## Statistics Grid

The statistics grid uses four equal columns and a gap of `20px`. Each stat card uses `20px` padding, a border radius of `12px`, and a minimum height of `104px` in the role-based layout.

The blue stat card uses a background gradient from `#eff6ff` to `#dff7ff`, and its border color is `#bfdbfe`. The green stat card uses a background gradient from `#f0fdf4` to `#dcfce7`, and its border color is `#bbf7d0`. The purple stat card uses a background gradient from `#eef2ff` to `#dbeafe`, and its border color is `#c7d2fe`. The orange stat card uses a background gradient from `#ecfeff` to `#cffafe`, and its border color is `#a5f3fc`.

The main statistic value uses a font size of `28px`, a font weight of `700`, and a line height of `1`. The statistic label uses a font size of `13px` and a font weight of `500`. The statistic supporting text uses a font size of `12px`, a font weight of `500`, and a top margin of `3px`.

## Section Access Grid

The section access grid uses two equal columns and a gap of `16px`. Each role access card uses a border of `1px solid #e5e7eb`, a border radius of `12px`, `14px` padding, and a white background. The card heading uses a font size of `14px`, a font weight of `600`, and a bottom margin of `10px`.

The chip wrap uses flex layout with wrapping enabled and a gap of `8px`. The gray badge uses a background of `#f3f4f6`, a text color of `#6b7280`, a border radius of `20px`, `3px 10px` padding, a font size of `12px`, and a font weight of `600`.

## Tasks and Alerts Section

The lower dashboard grid uses two columns in a `2fr 1fr` ratio, with a gap of `24px`. This means the tasks panel is intentionally wider than the alerts panel.

Each notice item inside tasks and alerts uses a light background of `#f9fafb`, a border of `1px solid #f3f4f6`, a border radius of `10px`, `14px` padding, and a gap of `14px` between the status dot and the content text. The hover background changes to `#f3f4f6`.

The status dot uses a width of `9px`, a height of `9px`, and a border radius of `50%`. The blue dot uses the brand blue `#2563eb`. The orange dot uses `#ea580c`. The red dot uses `#dc2626`.

The notice title uses a font size of `14px`, a font weight of `600`, and the color `#1f2937`. The notice description uses a font size of `13px` and the color `#6b7280`.

## Mobile Menu and Overlay

The mobile menu button uses a width of `40px`, a height of `40px`, a border radius of `8px`, a white background, and a border of `1px solid #e5e7eb`. The icon inside this button uses a width of `20px`, a height of `20px`, and a fill of `#4b5563`.

The sidebar overlay covers the full screen using fixed positioning and `inset: 0`. The overlay background uses `rgba(0, 0, 0, 0.35)`.

## Responsive Rules

At screen widths below `1200px`, the statistics grid changes from four columns to two columns.

At screen widths below `1024px`, the login shell changes from two columns to one column. At this same width, the login showcase panel receives a minimum height of `420px`. The large showcase heading reduces to `42px`. The bottom dashboard grid becomes a single column, and the section access grid also becomes a single column.

At screen widths below `768px`, the login page outer padding becomes `16px`. The login shell radius becomes `22px`. The login showcase padding becomes `28px 24px`. The showcase headline reduces to `32px`. The showcase paragraph reduces to `15px`. The showcase cards become a single-column grid. The login container padding becomes `32px 22px`. The role switcher becomes a two-column grid. The footer links wrap when needed.

At the same `768px` breakpoint, the dashboard sidebar moves off screen by translating `-260px` on the X axis. When the sidebar is opened, it returns to its normal position and uses a shadow of `4px 0 20px rgba(0, 0, 0, 0.1)`. The dashboard main content removes the left margin and uses `16px` padding. The profile header becomes a vertical layout, and the mobile menu button becomes visible.

## Documentation Note

This file is intended for design review, academic submission, project explanation, or handover documentation. It explains the exact UI values used in the current project and does not introduce any changes to the source code.
