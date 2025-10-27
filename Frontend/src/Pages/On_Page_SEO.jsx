import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, TriangleAlert, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import { AlertTriangle } from "lucide-react";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
export default function On_Page_SEO({darkMode }) {
  
  
  var { data, loading } = useData(); 
  data=data.Metric;
  if (!data) return <div />;

  
  const ScoreBadge = ({score,out,des}) => {
    const cssscore=score?"bg-green-300":"bg-red-300"
    const hasValue = score ? <Check size={18}/> : <X size={18}/>;
    const badgeBg = darkMode
      ? "bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-black"
      : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white";
const textColor = darkMode ? "text-white" : "text-black";
    return (
      <span className={`${
        darkMode
          ? `px-2.5 flex py-1 mobilebutton rounded-full text-black font-semibold text-sm shadow-md transform transition-transform `
          : `px-2.5 flex py-1 mobilebutton rounded-full text-black  font-semibold text-sm shadow-md transform transition-transform `
      } ${cssscore}`}>
        {hasValue} {out} {des}
      </span>
    );
  };

  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  return (
    <div
      id="OnPageSEO"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
        On-Page SEO{" "} 
         <CircularProgress value={data.On_Page_SEO.Percentage} size={70} stroke={5} />
        
      </h1>

      {/* Essentials */}
      <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500  ${cardBg}`}>
        <h2 className="text-xl font-bold mb-4">
          Essentials{" "}
      
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span>Title</span>
            {data.On_Page_SEO.Essentials.Title.Title_Exist?(<ScoreBadge score={data.On_Page_SEO.Essentials.Title.Score} 
            out={data.On_Page_SEO.Essentials.Title.Title_Length}
             des={"characters"}/>):"No Title Found"}
            
          </div>
          <div className="flex justify-between items-center">
            <span>Meta Description</span>
            <ScoreBadge score={data.On_Page_SEO.Essentials.Meta_Description.Score} 
            out={data.On_Page_SEO.Essentials.Meta_Description.MetaDescription_Length} 
            des={"characters"} />
          </div>
          <div className="flex justify-between items-center">
            <span>URL Structure</span>
            <ScoreBadge score={data.On_Page_SEO.Essentials.URL_Structure.Score} 
            des={data.On_Page_SEO.Essentials.URL_Structure.Score ? "Good": "Bad"}
        
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Canonical tag Existance</span>
            <ScoreBadge score={data.On_Page_SEO.Essentials.Canonical.Canonical_Exist} 
            des={data.On_Page_SEO.Essentials.Canonical.Canonical_Exist ? "Exist": "Not Exist"}
        
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Self referencing</span>
            <ScoreBadge score={data.On_Page_SEO.Essentials.Canonical.Score} 
            des={data.On_Page_SEO.Essentials.Canonical.Score ? "Yes": "No"}
        
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Pagination</span>
            <ScoreBadge score={data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score} 
            des={data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score ? "Good": "Bad"}
        
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Discriptive Internal Links</span>
            <ScoreBadge score={data.On_Page_SEO.Media_and_Semantics.Internal_Links.Descriptive_Score} 
            des={data.On_Page_SEO.Media_and_Semantics.Internal_Links.Descriptive_Score ? "Good": "Bad"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>ALT Text Relevance</span>
            <ScoreBadge score={data.On_Page_SEO.Media_and_Semantics.ALT_Text_Relevance.Score} 
            des={data.On_Page_SEO.Media_and_Semantics.ALT_Text_Relevance.Score ? "Good ALT Text": "Bad ALT Text"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>HTTPS</span>
            <ScoreBadge score={data.On_Page_SEO.Structure_and_Uniqueness.HTTPS.Score} 
            des={data.On_Page_SEO.Structure_and_Uniqueness.HTTPS.Score ? "Found https": "No https"}
            />
          </div>
          {/* <div className="flex justify-between items-center">
            <span>H1 tag</span>
            <ScoreBadge score={data.On_Page_SEO.Essentials.H1.Score} out={data.On_Page_SEO.Essentials.H1.H1_Count===0?"No H1 Found" :data.On_Page_SEO.Essentials.H1.H1_Count===1 ? "Exectly One H1":"More than one H1"} />
          </div> */}
        </div>
        {/* {(data.On_Page_SEO.Essentials.Unique_Title.Score==0 || data.On_Page_SEO.Essentials.Meta_Description.Score==0 || data.On_Page_SEO.Essentials.Canonical.Score==0 || data.On_Page_SEO.Essentials.H1.Score==0) &&( <hr className="text-black mt-3" />)} */}
       
        {/* <div className="p-1 mt-2">
        {data.On_Page_SEO.Essentials.Unique_Title.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Length of Title must be in between 30-60 characters</h1>)}
          {data.On_Page_SEO.Essentials.Meta_Description.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Length of MetaDescription must be less than 165 characters</h1>)}
          {data.On_Page_SEO.Essentials.Canonical.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Page URL must be same as Canonical tag href URL</h1>)}
          {data.On_Page_SEO.Essentials.H1.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/> {data.On_Page_SEO.Essentials.H1.H1_Count===0?"There must be exactly one H1 " :" There are more than one H1"}</h1>)}
          
          
        </div> */}
      </div>

      {/* Media & Semantics */}
      {/* <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-purple-500  ${cardBg}`}>
        <h2 className="text-xl font-bold mb-4">
          Media & Semantics{" "}
         
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4  text-sm">
          <div className="flex justify-between items-center">
            <span>Image ALT</span>
            <ScoreBadge score={data.On_Page_SEO.Media_and_Semantics.Image_ALT.Score} out={data.On_Page_SEO.Media_and_Semantics.Image_ALT.Score?"Meaningfull Alt":"Miningless Alt"}/>
          </div>
          <div className="flex justify-between items-center">
            <span>Heading Hierarchy</span>
            <ScoreBadge score={data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Follow===1 } out={data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Follow==0?"Not Found (h1->h2->h3)":data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Follow===1?"Follow h1->h2->h3":"No follow h1->h2->h3 "}/>
          </div>
          <div className="flex justify-between items-center">
            <span>Descriptive Links</span>
            <ScoreBadge score={data.On_Page_SEO.Media_and_Semantics.Descriptive_Links.Score} out={data.On_Page_SEO.Media_and_Semantics.Descriptive_Links.Score?"Button Text MeaningFull":"Button Text Meaningless"} />
          </div>
        </div>
        {(data.On_Page_SEO.Media_and_Semantics.Image_ALT.Score==0 || data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Score==0 || data.On_Page_SEO.Media_and_Semantics.Descriptive_Links.Score==0) &&(  <hr className="text-black mt-3" /> )}
       
        <div className="p-1 mt-2">
        {data.On_Page_SEO.Media_and_Semantics.Image_ALT.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Only Image which consist alt attribute must be Meaningfull !("", "image", "logo", "icon","pic","picture","photo"," ","12345","-","graphics")</h1>)}
          {data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>{data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Follow===0?"There is no heading Hierarchy (h1->h2->h3)":data.On_Page_SEO.Media_and_Semantics.Heading_Hierarchy.Follow===1?"Page following heading Hierarchy":"Not following the heading Hierarchy"}</h1>)}
          {data.On_Page_SEO.Media_and_Semantics.Descriptive_Links.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>anchor tag text must be meaningfull !("click here", "read more","learn more","details","link","more","go","this")</h1>)}
          
          
          
        </div>
      </div> */}

      {/* Structure & Uniqueness */}
      {/* <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-pink-500  ${cardBg}`}>
        <h2 className="text-xl font-bold mb-4">
          Structure & Uniqueness{" "}
         
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span>URL Structure</span>
            <ScoreBadge score={data.On_Page_SEO.Structure_and_Uniqueness.URL_Structure.Score } out={data.On_Page_SEO.Structure_and_Uniqueness.URL_Structure.Score==1? "Correct":"Wrong"}/>
          </div>
          <div className="flex justify-between items-center">
            <span>Duplicate Content</span>
            <ScoreBadge score={!data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score} out={!data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score ?"No Duplicate Content":"Duplicate Content"}/>
          </div>
          <div className="flex justify-between items-center">
            <span>Pagination Tags</span>
            <ScoreBadge score={data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score } out={data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score?"Pagination Not found":"Pagination found"}/>
          </div>
        </div>
        {(data.On_Page_SEO.Structure_and_Uniqueness.URL_Structure.Score==0 || !data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score==0 || data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score==0) &&( <hr className="text-black mt-3" /> )}
        
        <div className="p-1 mt-2">
        {data.On_Page_SEO.Structure_and_Uniqueness.URL_Structure.Score==0 &&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>URL Structure is meaningless</h1>)}
          {!data.On_Page_SEO.Structure_and_Uniqueness.Duplicate_Content.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Duplicate contnent occured within the page less than 50 %</h1>)}
          {data.On_Page_SEO.Structure_and_Uniqueness.Pagination_Tags.Score==0&&(<h1 className={`flex gap-2 warn`}><AlertTriangle size={20} className="text-red-700"/>Check for link rel to next and prev</h1>)}
          
          
          
        </div>
      </div> */}
      {/* Warnings, Passed, Failed Audits */}
      <AuditDropdown items={data.On_Page_SEO.Passed} title="Passed Audits" darkMode={darkMode} />
      <AuditDropdown items={data.On_Page_SEO.Warning} title="Warnings" darkMode={darkMode} />
      <AuditDropdown items={data.On_Page_SEO.Improvements} title="Failed Audits" darkMode={darkMode} />
    </div>
  );
}
